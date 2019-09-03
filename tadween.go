/*Copyright (c) 2019, Suliman Alsowelim
All rights reserved.
This source code is licensed under the MIT license found in the
LICENSE file in the root directory of this source tree.
*/

package main

import (
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"flag"
	"fmt"
	_ "github.com/mattn/go-sqlite3"
	"github.com/microcosm-cc/bluemonday"
	"html/template"
	"io/ioutil"
	"net/http"
	"os"
	"path"
	"regexp"
	"strings"
	"time"
)

var db *sql.DB
var htmlPurifier *bluemonday.Policy
var translate map[string]string
var textInputRegex, linkRegex, dbFilePath, templ_dir, httpsCert, httpsKey, site_title, site_about, adminUsername, adminPassword string
var adminSession *sessionDetails
var useHttps bool
var failedLoginAttempts int    // basic fight back mechanism against brute force attacks
var LoginBlockedTime time.Time // basic fight back mechanism against brute force attacks

type templData struct {
	T_id        string // post id
	Title       string
	Article     string
	Link        string
	Cat1        string
	Cat2        string
	Cat3        string
	Pdate       string
	Excer       string
	Ludate      string
	IsError     bool   // should display error?
	ErrorMsg    string // the error massege
	SiteTitle   string
	Term        string
	FormToken   string // CSRF protection
	Cats        template.HTML
	List        template.HTML
	HtmlArticle template.HTML
}
type sessionDetails struct {
	sessionToken string
	lastActive   time.Time
	formsToken   string // CSRF protection
}

func checkError(err error) {
	if err != nil {
		fmt.Println("Fatal error ", err.Error())
		os.Exit(1)
	}
}

/*
check if admin session is active.
extend it if active or redirect to login page if not
*/
func checkAuth(r *http.Request) bool {
	cookie, err := r.Cookie("tadween_platform")
	if err == nil {
		if cookie.Value == adminSession.sessionToken && len(cookie.Value) > 0 {
			if time.Since(adminSession.lastActive).Minutes() < 30 {
				// session active - extend it
				adminSession.lastActive = time.Now()
				return true
			}
		}
	}
	//no authenication or expired session: return false
	return false
}

func checkFormToken(r *http.Request) bool {
	if r.FormValue("formToken") == adminSession.formsToken {
		return true
	}
	return false
}

func setCookie(w http.ResponseWriter, deleteCookie bool, value string) {
	cookie := http.Cookie{Name: "tadween_platform", Path: "/", HttpOnly: true, Value: value}
	if useHttps {
		cookie.Secure = true
	}
	if deleteCookie {
		cookie.Value = "none"
		cookie.Expires = time.Unix(0, 0)
	}
	http.SetCookie(w, &cookie)
}

/*
check if admin session is active.
extend it if active and redirect to admin main page.
otherwise provide login form for GET requests or process form input for POSTs.
*/
func loginHandler(w http.ResponseWriter, r *http.Request) {
	//check cookie
	cookie, err := r.Cookie("tadween_platform")
	if err == nil {
		if cookie.Value == adminSession.sessionToken && len(cookie.Value) > 0 {
			if time.Since(adminSession.lastActive).Minutes() < 30 {
				// session active - extend it
				adminSession.lastActive = time.Now()
				http.Redirect(w, r, "/admin/", http.StatusSeeOther)
				return
			}
		}
		//session not active - delete the current cookie
		setCookie(w, true, "")
	}
	//from here: no cookie
	if r.Method == "GET" {
		t, _ := template.ParseFiles(templ_dir+"admin/login.html", templ_dir+"loadjs.html", templ_dir+"loadcss.html", templ_dir+"footer.html")
		t.Execute(w, nil)
		return
	} else if r.Method == "POST" {
		if time.Since(LoginBlockedTime).Minutes() < 15 && failedLoginAttempts > 5 {
			//blocked sign in
			fmt.Println(time.Now().Format("2006/01/02:15:04:05") + " login is blocked ...")
			temp := templData{
				IsError:  true,
				ErrorMsg: translate["login_blocked"],
			}
			t, _ := template.ParseFiles(templ_dir+"admin/login.html", templ_dir+"loadjs.html", templ_dir+"loadcss.html", templ_dir+"footer.html")
			t.Execute(w, temp)
			return
		}

		authorized := false
		if r.FormValue("username") == adminUsername && r.FormValue("password") == adminPassword {
			authorized = true
		}

		if !authorized {
			// incorrect username or userid, or not provided
			failedLoginAttempts += 1
			if failedLoginAttempts > 5 {
				LoginBlockedTime = time.Now()
			}
			fmt.Println(time.Now().Format("2006/01/02:15:04:05") + " incorrect username or password provided")
			temp := templData{
				IsError:  true,
				ErrorMsg: translate["login_error"],
			}
			t, _ := template.ParseFiles(templ_dir+"admin/login.html", templ_dir+"loadjs.html", templ_dir+"loadcss.html", templ_dir+"footer.html")
			t.Execute(w, temp)
			return
		}
		// authorized from here
		adminSession = &sessionDetails{

			sessionToken: randomToken(32),
			lastActive:   time.Now(),
			formsToken:   randomToken(32),
		}
		setCookie(w, false, adminSession.sessionToken)
		//reset failed login counter
		failedLoginAttempts = 0
		http.Redirect(w, r, "/admin/", http.StatusFound)
	}
}

func mainHandler(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r, "/blog/", http.StatusFound)
}

func errorHandler(w http.ResponseWriter, r *http.Request) {
	temp := templData{
		SiteTitle: site_title,
	}
	t, _ := template.ParseFiles(templ_dir+"error.html", templ_dir+"top-bar.html", templ_dir+"footer.html", templ_dir+"loadjs.html", templ_dir+"loadcss.html")
	err := t.Execute(w, temp)
	checkError(err)
}

func adminErrorHandler(w http.ResponseWriter, r *http.Request) {
	if !checkAuth(r) {
		http.Redirect(w, r, "/login/", http.StatusFound)
	}

	t, _ := template.ParseFiles(templ_dir+"error.html", templ_dir+"admin/top-bar.html", templ_dir+"footer.html", templ_dir+"loadjs.html", templ_dir+"loadcss.html")
	err := t.Execute(w, nil)
	checkError(err)
}

/*
about page /about/
*/
func aboutHandler(w http.ResponseWriter, r *http.Request) {
	temp := templData{
		SiteTitle: site_title,
		Article:   site_about,
	}
	t, _ := template.ParseFiles(templ_dir+"about.html", templ_dir+"top-bar.html", templ_dir+"footer.html", templ_dir+"loadjs.html", templ_dir+"loadcss.html")
	err := t.Execute(w, temp)
	checkError(err)
}

//TO-DO: rewrite - escape strings. This should be safe anyway for now  since we are checking user input with regex.
func listHandler(w http.ResponseWriter, r *http.Request) {
	foundlist := false
	if r.Method == "GET" {
		term := r.URL.Query().Get("term")
		match, _ := regexp.MatchString(textInputRegex, term)
		if len(term) == 0 || len(term) > 500 || !match {
			//not valid id parameter
			http.Redirect(w, r, "/error/", http.StatusSeeOther)
			return
		}
		termtodisplay := ""
		recent_posts_html := `<ul class="no-bullet">`
		if term == "all" {
			foundlist = true
			termtodisplay = translate["all_posts"]
			rows2, err2 := db.Query(`select title, excerpt, strftime('%d/%m/%Y', pdate),
	link from content
	ORDER BY pdate DESC`)
			checkError(err2)
			title, excerpt, pdate, link := "", "", "", ""
			defer rows2.Close()
			for rows2.Next() {
				err4 := rows2.Scan(&title, &excerpt, &pdate, &link)
				recent_posts_html += ` <li>
<h3> <a href="/posts/` + link + `">` + title + `</a> 
  <small>` + pdate + `</small>
</h3>
      <p class="excerpt"> ` + excerpt + `</p>
</li>`
				checkError(err4)
			}
		} else {
			rows2, err2 := db.Query(`select title, excerpt, strftime('%d/%m/%Y', pdate),
	link from content WHERE (cat1 = ? or cat2 =? or cat3 = ?)
	ORDER BY pdate DESC`, term, term, term)
			checkError(err2)

			title, excerpt, pdate, link := "", "", "", ""
			defer rows2.Close()
			for rows2.Next() {
				foundlist = true
				termtodisplay = term
				err4 := rows2.Scan(&title, &excerpt, &pdate, &link)
				recent_posts_html += ` <li>
<h3> <a href="/posts/` + link + `">` + title + `</a> 
  <small>` + pdate + `</small>
</h3>
      <p class="excerpt"> ` + excerpt + `</p>
</li>`
				checkError(err4)
			}
		}
		if foundlist {
			recent_posts_html += "</ul>"
			temp := templData{
				SiteTitle: site_title,
				Term:      termtodisplay,
				List:      template.HTML(recent_posts_html),
			}
			t, _ := template.ParseFiles(templ_dir+"list.html", templ_dir+"top-bar.html", templ_dir+"footer.html", templ_dir+"loadjs.html", templ_dir+"loadcss.html")
			errr := t.Execute(w, temp)
			checkError(errr)
		} else {
			http.Redirect(w, r, "/error/", http.StatusSeeOther)
		}
	} else {
		http.Redirect(w, r, "/blog/", http.StatusSeeOther)
	}
}

//TO-DO: rewrite - escape strings. This should be safe anyway for now  since we are checking user input with regex.
func blogHandler(w http.ResponseWriter, r *http.Request) {
	// ********get categories.
	tmpstring := ""
	cathtml := `<ul class="no-bullet catfont">`
	recent_posts_html := `<ul class="no-bullet">`
	rows1, err1 := db.Query(`select count(*) from content`)
	if err1 != nil {
		panic(err1)
	}
	total := ""
	defer rows1.Close()
	for rows1.Next() {
		err6 := rows1.Scan(&total)
		tmpstring = translate["all_posts"] + " (" + total + ")"
		cathtml += `<li> 
		 <a href="/list/?term=` + "all" + `"> <b>` + tmpstring + `</b> </a>
	</li>`
		if err6 != nil {
			panic(err6)
		}
	}
	rows, err := db.Query(`select cat1, count(*) as tot
	from
	(
	  select cat1
	  from content
	  union all
	  select cat2
	  from content
	union all
	select cat3
	from content
	)
	group by cat1
	order by tot desc`)
	if err != nil {
		panic(err)
	}
	cat := ""
	count := ""
	defer rows.Close()
	for rows.Next() {
		err3 := rows.Scan(&cat, &count)
		if cat == "" {
			continue
		}
		tmpstring = cat + " (" + count + ")"
		cathtml += `<li> 
		 <a href="/list/?term=` + cat + `"> ` + tmpstring + `</a>
	</li>`
		if err3 != nil {
			panic(err3)
		}
	}
	cathtml += "</ul>"
	// get lastsposts
	rows2, err2 := db.Query(`select title, excerpt, strftime('%d/%m/%Y', pdate), link 
	from content ORDER BY pdate DESC  limit 3`)
	if err2 != nil {
		panic(err2)
	}
	title, excerpt, pdate, link := "", "", "", ""
	defer rows2.Close()
	for rows2.Next() {
		err4 := rows2.Scan(&title, &excerpt, &pdate, &link)
		recent_posts_html += ` <li>
<h3> <a href="/posts/` + link + `">` + title + `</a> 
  <small>` + pdate + `</small>
</h3>
      <p class="excerpt"> ` + excerpt + " " + `<a 
      href="/posts/` + link + `">` + "..." + `</a> </p>
</li>`
		checkError(err4)
	}
	recent_posts_html += "</ul>"
	temp := templData{
		SiteTitle: site_title,
		Cats:      template.HTML(cathtml),
		List:      template.HTML(recent_posts_html),
	}
	t, _ := template.ParseFiles(templ_dir+"blog.html", templ_dir+"top-bar.html", templ_dir+"footer.html", templ_dir+"loadjs.html", templ_dir+"loadcss.html")
	err = t.Execute(w, temp)
	checkError(err)
}

/*
handle /posts/ page. Display actual content based on the requested link
*/
func postsHandler(w http.ResponseWriter, r *http.Request) {
	//get the last part of url. sanitize.
	link := path.Base(r.URL.Path)
	link = strings.Replace(link, ".html", "", 1)
	link = strings.ToLower(link)
	match, _ := regexp.MatchString(linkRegex, link)
	if len(link) == 0 || len(link) > 1000 || !match {
		http.Redirect(w, r, "/error/", http.StatusSeeOther)
		return
	}
	title := " "
	article := " "
	cat1 := " "
	cat2 := " "
	cat3 := " "
	pdate := ""
	ludate := ""
	var lastupdate_date sql.NullString
	t_id := 3
	rows, err := db.Query(`SELECT t_id, title, strftime('%d/%m/%Y', pdate),strftime('%d/%m/%Y', ludate),cat1,cat2,cat3,article FROM content where link = ?`, link)
	checkError(err)
	postfound := false
	defer rows.Close()
	for rows.Next() {
		err3 := rows.Scan(&t_id, &title, &pdate, &lastupdate_date, &cat1, &cat2, &cat3, &article)
		checkError(err3)
		if lastupdate_date.Valid {
			ludate = lastupdate_date.String
		}
		postfound = true
	}
	if postfound {
		pdate = translate["publish_date"] + ":" + pdate
		if len(ludate) > 1 {
			ludate = translate["last_update_date"] + ":" + ludate
		}
		temp := templData{
			SiteTitle:   site_title,
			Title:       title,
			HtmlArticle: template.HTML(article),
			Pdate:       pdate,
			Ludate:      ludate,
		}
		t, _ := template.ParseFiles(templ_dir+"post.html", templ_dir+"top-bar.html", templ_dir+"footer.html", templ_dir+"loadjs.html", templ_dir+"loadcss.html")
		errr := t.Execute(w, temp)
		checkError(errr)
	} else {
		http.Redirect(w, r, "/error/", http.StatusSeeOther)
	}
}

//TO-DO: rewrite - escape strings. This should be safe anyway for now  since we are checking user input with regex.
func admin_handler(w http.ResponseWriter, r *http.Request) {
	if !checkAuth(r) {
		http.Redirect(w, r, "/login/", http.StatusFound)
	}
	final_string := ""
	tmpstring := ""
	var r_string [3]string
	rows, err := db.Query(`SELECT t_id,title,strftime('%d/%m/%Y', pdate) FROM content`)
	checkError(err)
	defer rows.Close()
	for rows.Next() {
		err3 := rows.Scan(&r_string[0], &r_string[1], &r_string[2])
		tmpstring = ""
		tmpstring += "<tr>"
		tmpstring += "<td>" + r_string[0] + "</td>"
		tmpstring += "<td>" + `<a href="/editpost/?id=` + r_string[0] + `">` + r_string[1] + `</a>` + "</td>"
		tmpstring += "<td>" + r_string[2] + "</td>"
		tmpstring += "</tr>"
		final_string += tmpstring
		if err3 != nil {
			panic(err3)
		}
	}

	temp := templData{
		List: template.HTML(final_string),
	}
	t, _ := template.ParseFiles(templ_dir+"admin/admin.html", templ_dir+"admin/top-bar.html", templ_dir+"footer.html", templ_dir+"loadjs.html", templ_dir+"loadcss.html")
	err = t.Execute(w, temp)
	checkError(err)
}

func settingsHandler(w http.ResponseWriter, r *http.Request) {
	if !checkAuth(r) {
		http.Redirect(w, r, "/login/", http.StatusFound)
	}
	if r.Method == "POST" {
		if !checkFormToken(r) {
			setCookie(w, true, "")
			http.Redirect(w, r, "/login/", http.StatusFound)
			return
		}
		trimFormSpace(r)
		// check if form value is valid
		title := r.FormValue("title")
		excer := r.FormValue("excer")
		match1, _ := regexp.MatchString(textInputRegex, title)
		match2, _ := regexp.MatchString(textInputRegex, excer)

		if !match1 || !match2 || len(title) == 0 || len(title) > 1000 || len(excer) == 0 || len(excer) > 5000 {
			temp := templData{
				Title:     r.FormValue("title"),
				Excer:     r.FormValue("excer"),
				FormToken: adminSession.formsToken,
				IsError:   true,
				ErrorMsg:  translate["update_site_meta_error"],
			}
			t, _ := template.ParseFiles(templ_dir+"admin/settings.html", templ_dir+"admin/top-bar.html", templ_dir+"footer.html", templ_dir+"loadjs.html", templ_dir+"loadcss.html")
			err := t.Execute(w, temp)
			checkError(err)
			return
		}

		_, err := db.Exec(`INSERT OR Replace INTO metadata
				   (m_id,title,description) VALUES (
				    ?,?,?)`,
			0, r.FormValue("title"), r.FormValue("excer"))
		if err != nil {
			panic(err)
		}
		site_title = r.FormValue("title")
		site_about = r.FormValue("excer")
		http.Redirect(w, r, "/admin/", http.StatusFound)
	} else if r.Method == "GET" {
		temp := templData{
			Title:     site_title,
			Excer:     site_about,
			FormToken: adminSession.formsToken,
		}
		t, _ := template.ParseFiles(templ_dir+"admin/settings.html", templ_dir+"admin/top-bar.html", templ_dir+"footer.html", templ_dir+"loadjs.html", templ_dir+"loadcss.html")
		err := t.Execute(w, temp)
		checkError(err)
	}
}

func editpostHandler(w http.ResponseWriter, r *http.Request) {
	if !checkAuth(r) {
		http.Redirect(w, r, "/login/", http.StatusFound)
	}
	t_id := r.URL.Query().Get("id")
	if len(t_id) == 0 {
		http.Redirect(w, r, "/error/", http.StatusSeeOther)
	}
	if r.Method == "GET" {
		title := " "
		article := " "
		link := " "
		cat1 := " "
		cat2 := " "
		cat3 := " "
		pdate := " "
		excerpt := ""
		ludate := time.Now().Format("2006-01-02")
		var lastupdate_date sql.NullString
		rows, err := db.Query(`SELECT title, strftime('%Y-%m-%d', pdate),link,cat1,cat2,cat3,article, excerpt, strftime('%Y-%m-%d', ludate) FROM content where t_id = ?`, t_id)
		if err != nil {
			panic(err)
		}
		defer rows.Close()
		for rows.Next() {
			err3 := rows.Scan(&title, &pdate, &link, &cat1, &cat2, &cat3, &article, &excerpt, &lastupdate_date)
			if err3 != nil {
				panic(err3)
			}
		}
		if lastupdate_date.Valid {
			ludate = lastupdate_date.String
		}
		temp := templData{
			T_id:      t_id,
			Title:     title,
			Article:   article,
			Link:      link,
			Cat1:      cat1,
			Cat2:      cat2,
			Cat3:      cat3,
			Pdate:     pdate,
			Ludate:    ludate,
			Excer:     excerpt,
			FormToken: adminSession.formsToken,
		}
		t, _ := template.ParseFiles(templ_dir+"admin/edit_post.html", templ_dir+"admin/top-bar.html", templ_dir+"footer.html", templ_dir+"loadjs.html", templ_dir+"loadcss.html")
		errr := t.Execute(w, temp)
		checkError(errr)
	} else if r.Method == "POST" {
		if !checkFormToken(r) {
			setCookie(w, true, "")
			http.Redirect(w, r, "/login/", http.StatusFound)
			return
		}
		trimFormSpace(r)
		iserror, errormsg := checkFormInput(r, true)
		if iserror {
			temp := templData{
				T_id:      t_id,
				Title:     r.FormValue("title"),
				Article:   r.FormValue("htmlcontent"),
				Link:      r.FormValue("link"),
				Cat1:      r.FormValue("cat1"),
				Cat2:      r.FormValue("cat2"),
				Cat3:      r.FormValue("cat3"),
				Pdate:     r.FormValue("pdate"),
				Ludate:    r.FormValue("ludate"),
				Excer:     r.FormValue("excer"),
				FormToken: adminSession.formsToken,
				IsError:   iserror,
				ErrorMsg:  errormsg,
			}
			t, _ := template.ParseFiles(templ_dir+"admin/edit_post.html", templ_dir+"admin/top-bar.html", templ_dir+"footer.html", templ_dir+"loadjs.html", templ_dir+"loadcss.html")
			errr := t.Execute(w, temp)
			checkError(errr)
			return
		}
		_, err := db.Exec(`INSERT OR Replace INTO content
				   (t_id,article,title,link,cat1, cat2, cat3 ,pdate,ludate, excerpt) VALUES (
				    ?,?,?, ?, ?,?,?,?,?,?)`,
			t_id, htmlPurifier.Sanitize(r.FormValue("htmlcontent")), r.FormValue("title"), strings.ToLower(r.FormValue("link")),
			r.FormValue("cat1"), r.FormValue("cat2"), r.FormValue("cat3"),
			r.FormValue("pdate"), r.FormValue("ludate"), r.FormValue("excer"))
		if err != nil {
			panic(err)
		}
		http.Redirect(w, r, "/admin/", http.StatusFound)
	}

}

/*
Checking submitted user data in adding or editing posts.
If there is an error, return false with string explanation.
*/
func checkFormInput(r *http.Request, iseditform bool) (bool, string) {

	if len(r.FormValue("title")) == 0 || len(r.FormValue("title")) > 250 {
		return true, translate["title_length_error"]
	} else {
		match, _ := regexp.MatchString(textInputRegex, r.FormValue("title"))
		if !match {
			return true, translate["invalid_title_error"]
		}
	}

	if len(r.FormValue("link")) == 0 || len(r.FormValue("link")) > 250 {
		return true, translate["link_length_error"]
	} else {
		// check validity of link
		match, _ := regexp.MatchString(linkRegex, r.FormValue("link"))
		if !match {
			return true, translate["invalid_link_error"]
		}
		// check if link already exist
		if !iseditform {
			rows, err := db.Query(`select title from content where link = ?`, strings.ToLower(r.FormValue("link")))
			checkError(err)
			defer rows.Close()
			for rows.Next() {
				return true, translate["exist_link_error"]
			}
		}
	}
	if len(r.FormValue("cat1")) != 0 {
		if len(r.FormValue("cat1")) > 250 {
			return true, translate["cat1_length_error"]
		} else {
			match, _ := regexp.MatchString(textInputRegex, r.FormValue("cat1"))
			if !match {
				return true, translate["invalid_cat1_error"]
			}
		}

	}
	if len(r.FormValue("cat1")) != 0 {
		if len(r.FormValue("cat1")) > 250 {
			return true, translate["cat1_length_error"]
		} else {
			match, _ := regexp.MatchString(textInputRegex, r.FormValue("cat1"))
			if !match {
				return true, translate["invalid_cat1_error"]
			}
		}

	}
	if len(r.FormValue("cat2")) != 0 {
		if len(r.FormValue("cat2")) > 250 {
			return true, translate["cat2_length_error"]
		} else {
			match, _ := regexp.MatchString(textInputRegex, r.FormValue("cat2"))
			if !match {
				return true, translate["invalid_cat2_error"]
			}
		}

	}
	if len(r.FormValue("cat3")) != 0 {
		if len(r.FormValue("cat3")) > 250 {
			return true, translate["cat3_length_error"]
		} else {
			match, _ := regexp.MatchString(textInputRegex, r.FormValue("cat3"))
			if !match {
				return true, translate["invalid_cat3_error"]
			}
		}

	}

	if len(r.FormValue("excer")) == 0 || len(r.FormValue("excer")) > 500 {
		return true, translate["excer_length_error"]
	} else {
		match, _ := regexp.MatchString(textInputRegex, r.FormValue("excer"))
		if !match {
			return true, translate["invalid_excer_error"]
		}

	}

	if len(r.FormValue("htmlcontent")) == 0 {
		return true, translate["htmlcontent_length_error"]
	}

	if len(r.FormValue("pdate")) == 0 {
		return true, translate["empty_pdate_error"]
	} else {
		match, _ := regexp.MatchString(`^\d{4}-\d{2}-\d{2}$`, r.FormValue("pdate"))
		if !match {
			return true, translate["invalid_pdate_error"]
		}
	}

	if iseditform {
		if len(r.FormValue("ludate")) != 0 {
			match, _ := regexp.MatchString(`^\d{4}-\d{2}-\d{2}$`, r.FormValue("ludate"))
			if !match {
				return true, translate["invalid_ludate_error"]
			}
		}

	}

	return false, ""

}

func addpostHandler(w http.ResponseWriter, r *http.Request) {
	if !checkAuth(r) {
		http.Redirect(w, r, "/login/", http.StatusFound)
		return
	}
	if r.Method == "POST" {
		if !checkFormToken(r) {
			setCookie(w, true, "")
			http.Redirect(w, r, "/login/", http.StatusFound)
			return
		}
		trimFormSpace(r)
		iserror, errormsg := checkFormInput(r, false)
		if iserror {
			fmt.Println(errormsg)
			temp := templData{
				Title:     r.FormValue("title"),
				Article:   r.FormValue("htmlcontent"),
				Link:      r.FormValue("link"),
				Cat1:      r.FormValue("cat1"),
				Cat2:      r.FormValue("cat2"),
				Cat3:      r.FormValue("cat3"),
				Pdate:     r.FormValue("pdate"),
				Excer:     r.FormValue("excer"),
				FormToken: adminSession.formsToken,
				IsError:   iserror,
				ErrorMsg:  errormsg,
			}
			t, _ := template.ParseFiles(templ_dir+"admin/add_post.html", templ_dir+"admin/top-bar.html", templ_dir+"footer.html", templ_dir+"loadjs.html", templ_dir+"loadcss.html")
			errr := t.Execute(w, temp)
			checkError(errr)
			return
		}

		_, err := db.Exec(`INSERT INTO content
				   (article,title,link,cat1, cat2, cat3 ,pdate,excerpt) VALUES (
				    ?,?, ?, ?,?,?,?,?)`,
			htmlPurifier.Sanitize(r.FormValue("htmlcontent")), r.FormValue("title"), strings.ToLower(r.FormValue("link")),
			r.FormValue("cat1"), r.FormValue("cat2"), r.FormValue("cat3"),
			r.FormValue("pdate"), r.FormValue("excer"))
		if err != nil {
			panic(err)
		}
		http.Redirect(w, r, "/admin/", http.StatusFound)
	} else if r.Method == "GET" {
		temp := templData{
			Pdate:     time.Now().Format("2006-01-02"),
			FormToken: adminSession.formsToken,
		}
		t, _ := template.ParseFiles(templ_dir+"admin/add_post.html", templ_dir+"admin/top-bar.html", templ_dir+"footer.html", templ_dir+"loadjs.html", templ_dir+"loadcss.html")
		errr := t.Execute(w, temp)
		checkError(errr)
	}
}

func deletePostHandler(w http.ResponseWriter, r *http.Request) {
	if !checkAuth(r) {
		http.Redirect(w, r, "/login/", http.StatusFound)
	}
	if r.Method == "POST" {
		if !checkFormToken(r) {
			setCookie(w, true, "")
			http.Redirect(w, r, "/login/", http.StatusFound)
			return
		}
		t_id := r.FormValue("t_id_delete")
		if len(t_id) == 0 || t_id == "0" {
			http.Redirect(w, r, "/error/", http.StatusFound)
			return
		}
		_, err := db.Exec(`Delete From content where t_id = ?`, t_id)
		checkError(err)
	}
	http.Redirect(w, r, "/admin/", http.StatusFound)

}
func previewHandler(w http.ResponseWriter, r *http.Request) {
	if !checkAuth(r) {
		http.Redirect(w, r, "/login/", http.StatusFound)
	}
	if r.Method == "POST" {
		if !checkFormToken(r) {
			setCookie(w, true, "")
			http.Redirect(w, r, "/login/", http.StatusFound)
			return
		}
		article := htmlPurifier.Sanitize(r.FormValue("htmlcontent_preview"))
		pdate := r.FormValue("pdate_preview")
		pdate = translate["publish_date"] + ":" + pdate
		ludate := r.FormValue("ludate_preview")
		if len(ludate) > 1 {
			ludate = translate["last_update_date"] + ":" + ludate
		}
		temp := templData{
			SiteTitle:   site_title,
			Title:       r.FormValue("title_preview"),
			HtmlArticle: template.HTML(article),
			Pdate:       pdate,
			Ludate:      ludate,
		}
		t, _ := template.ParseFiles(templ_dir+"preview.html", templ_dir+"footer.html", templ_dir+"loadjs.html", templ_dir+"loadcss.html")
		errr := t.Execute(w, temp)
		checkError(errr)
	} else {
		http.Redirect(w, r, "/error/", http.StatusSeeOther)
	}
}

func logoutHandler(w http.ResponseWriter, r *http.Request) {
	if !checkAuth(r) {
		http.Redirect(w, r, "/login/", http.StatusFound)
	}
	//create dummy session
	adminSession = &sessionDetails{
		sessionToken: randomToken(20),
		lastActive:   time.Now(),
	}
	//delete cookie
	setCookie(w, true, "")
	//redirect to login page
	http.Redirect(w, r, "/login/", http.StatusFound)

}

func loadTranslation() {
	//https://www.socketloop.com/tutorials/golang-how-to-convert-json-string-to-map-and-slice
	file, _ := ioutil.ReadFile(templ_dir + "translation.json")
	translate = make(map[string]string)
	err := json.Unmarshal([]byte(file), &translate)
	if err != nil {
		panic(err)
	}
}

func main() {
	//parse flags https://gobyexample.com/command-line-flags
	flag.StringVar(&dbFilePath, "db", "db_blog.sqlite", "db file path")
	flag.StringVar(&templ_dir, "tdir", "./templates/ar/", "templates directroy path")
	flag.StringVar(&httpsCert, "cert", "", "https certificate path")
	flag.StringVar(&httpsKey, "key", "", "https private key path")
	flag.Parse()
	fmt.Println(time.Now().Format("2006/01/02:15:04:05") + "[starting server]")
	//init some variables
	useHttps = true
	if len(httpsCert) == 0 || len(httpsKey) == 0 {
		useHttps = false
	}
	linkRegex = `^[a-zA-Z0-9_\-#]+$`
	textInputRegex = `^[\p{L}\p{Nd}\s_\-,.،@~+:;^*)({}$#!?؟\\/!']+$`
	adminUsername = "admin"
	adminPassword = "admin"
	htmlPurifier = bluemonday.UGCPolicy()
	failedLoginAttempts = 0
	LoginBlockedTime = time.Now() // init value only. has no effect unless failedLoginAttempts > 5
	loadTranslation()
	db = connectToDB()
	loadSiteDescription()
	//create dummy session
	adminSession = &sessionDetails{
		sessionToken: randomToken(20),
		lastActive:   time.Now(),
	}

	//need auth
	http.HandleFunc("/admin/", admin_handler)
	http.HandleFunc("/aderror/", adminErrorHandler)
	http.HandleFunc("/settings/", settingsHandler)
	http.HandleFunc("/addpost/", addpostHandler)
	http.HandleFunc("/editpost/", editpostHandler)
	http.HandleFunc("/login/", loginHandler)
	http.HandleFunc("/delete/", deletePostHandler)
	http.HandleFunc("/preview/", previewHandler)
	http.HandleFunc("/logout/", logoutHandler)

	//visitors, no auth
	http.HandleFunc("/", mainHandler)
	http.HandleFunc("/about/", aboutHandler)
	http.HandleFunc("/blog/", blogHandler)
	http.HandleFunc("/posts/", postsHandler)
	http.HandleFunc("/list/", listHandler)
	http.HandleFunc("/error/", errorHandler)

	fs1 := justFilesFilesystem{http.Dir("static/")}
	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(fs1)))
	if useHttps {
		fmt.Println(time.Now().Format("2006/01/02:15:04:05") + " serve over https")
		http.ListenAndServeTLS(":443", httpsCert, httpsKey, nil)
	} else {
		fmt.Println(time.Now().Format("2006/01/02:15:04:05") + " serve over http")
		http.ListenAndServe(":8080", nil)
	}
}

//http://stackoverflow.com/questions/13302020/rendering-css-in-a-go-web-application
type justFilesFilesystem struct {
	fs http.FileSystem
}

func (fs justFilesFilesystem) Open(name string) (http.File, error) {
	f, err := fs.fs.Open(name)
	if err != nil {
		return nil, err
	}
	return neuteredReaddirFile{f}, nil
}

type neuteredReaddirFile struct {
	http.File
}

func (f neuteredReaddirFile) Readdir(count int) ([]os.FileInfo, error) {
	return nil, nil
}

//connect to db file, if doesn't exist create tables and add tutorial post
func connectToDB() *sql.DB {
	db, err := sql.Open("sqlite3", dbFilePath)
	db.SetConnMaxLifetime(time.Second * 14400)
	checkError(err)
	// if db file does not exist -> init tables
	if _, err := os.Stat(dbFilePath); os.IsNotExist(err) {
		fmt.Println(time.Now().Format("2006/01/02:15:04:05") + " new db, create tables")
		stmt := "create table if not exists content (t_id INTEGER PRIMARY KEY, title TEXT,link TEXT,cat1 TEXT, cat2 TEXT, cat3 TEXT,pdate DATETIME,ludate DATETIME, article TEXT, excerpt TEXT)"
		_, err = db.Exec(stmt)
		checkError(err)
		stmt = "create table if not exists metadata (m_id INTEGER PRIMARY KEY,title TEXT, description Text)"
		_, err = db.Exec(stmt)
		checkError(err)
		_, err = db.Exec(`INSERT OR Replace INTO metadata
			   (m_id,title,description) VALUES (
				    ?,?,?)`,
			0, translate["init_site_title"], translate["init_site_about"])
		checkError(err)
		html_post, derr := base64.StdEncoding.DecodeString(translate["tutorial_post_encoded"])
		checkError(derr)
		_, err = db.Exec(`INSERT OR Replace INTO content
				   (article,title,link,cat1, cat2, cat3 ,pdate,excerpt) VALUES (
				    ?,?, ?, ?,?,?,?,?)`,
			htmlPurifier.Sanitize(string(html_post)), translate["tutorial_title"], "tadween_tutorial",
			translate["tutorial_cat"], "", "", time.Now().Format("2006-01-02"), translate["tutorial_excer"])
		checkError(err)
	}
	return db
}
func loadSiteDescription() {
	rows, err := db.Query(`select title, description from metadata
	where m_id = 0`)
	checkError(err)
	title, excerpt := "", ""
	defer rows.Close()
	for rows.Next() {
		err4 := rows.Scan(&title, &excerpt)
		checkError(err4)
	}
	site_title = title
	site_about = excerpt
}
func randomToken(length int) string {
	/*
	   https://www.socketloop.com/tutorials/golang-how-to-generate-random-string
	*/
	size := length
	rb := make([]byte, size)
	_, err := rand.Read(rb)

	if err != nil {
		fmt.Println(err)
	}
	rs := base64.URLEncoding.EncodeToString(rb)
	return rs
}

// remove leading and trailing white spaces from user form submission
func trimFormSpace(r *http.Request) {
	for key, values := range r.Form {
		for i := range values {
			r.Form[key][i] = strings.TrimSpace(r.Form[key][i])
		}
	}
}
