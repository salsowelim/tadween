# Tadween: Minimal Personal Blogging Platform With Wysiwyg Editor and RTL Support

<div dir="rtl">
 
منصة تدوين هي منصة مبسطة لنشر التدوينات. تدعم العربية بشكل كامل، وتستخدم محرر نصوص حديث.


 [نسخة تجريبية عربية ](http://35.158.0.91:5050/login/)

كلمة المرور واسم المستخدم admin.

جميع التفاصيل التقنية مذكورة في الشرح بالأسفل.
</div>

Tadween is a bare minimum golang personal blogging platform that maintain simplicity and offers a traditional blogging experience. Featuring a draftjs based wysiwyg editor and RTL support.

## Features:
- **Live posting** via a dedicated admin interface. Using a cookie based authentication over https.
- Rich text **wysiwyg editor based on [draftjs](https://github.com/facebook/draft-js)**.
- **Simple**, easy to customize.
- Built using fairly modern tools (golang, react, foundation). Things like **responsiveness and https are supported out of the box**.
- Built-in **support for both RTL and LTR**. (Arabic and English are supported. if you want to add another language see the instructions below.)

## Demo
- Admin [control panel](http://35.158.0.91:6060/login/) (username and password: admin).
- The [actual blog](http://35.158.0.91:6060/login/)

 Content is wiped every 15 minutes.
 
 ([Arabic demo](http://35.158.0.91:5050/login/) also available).

## Tools and Dependencies:
- Golang: for running server code (tested on versions >= 1.10).
- Foundation (v6) for web pages aesthetics and functionality.
- Javascript (jquery-react) for web functionality such as the text editor.
- [react-rte](https://github.com/sstur/react-rte) wysiwyg editor.
- SQLite: for storage.


## Server code (tadween.go)

- Two external dependencies: [sqlite driver](https://github.com/mattn/go-sqlite3), [bluemonday](https://github.com/microcosm-cc/bluemonday).
- The server uses basic session mechanism for admin access: store cookies on client after successful login and destroy the session after some time of inactivity. Only one session is permitted at a time (default username and password: admin). Admin password is hardcoded for now. This is NOT ok If you don't deploy tadween yourself, or don't trust the deployer nor the infastructure.
- Admin interface accessible at /admin/. Head to homepage / for blog access.

- tadween.go accepts 4 options:
   1. -db: sqlite file path (default is ./db_blog.sqlite)
   2. -tdir the templates folder path that contain html files and a json file that contains strings translation. (default is ./templates/ar/ english templates also available at ./templates/en/)
   3. -cert: path to https certificate file.
   4. -key: path to https private key file (if either of options 3,4 is not provided, default is to serve over http (***NOT RECOMMENDED))
   
- Server will create new db file if not provided with a path to a non zero size file. it will be populated with a tutorial post and initial site title and about text.
- For now: debugging and information logging is printed as normal fmt.print statements.

## Steps to add a non-supported language:

1. Create a new templates directory that contain html files and a json strings translation file. (hint: start with /templates/ar folder for RTL language and /templates/en for LTR).
2. Translate the strings inside html and json files.
3. The text editor needs manual translation also. react-rte folder contains the react npm project for the editor. You have the option to just use the english version (editor_en.js), it is almost self explanatory.
4. Provide the templates directory path as an option (-tdir) to tadween.go


### Browser Support
Draftjs has some compatibility issues currently with mobile browsers. However, it might work for quick edits such as fixing typos. I will just copy below the browser support from foundation and draftjs projects.

- Admin interface ([src](https://github.com/facebook/draft-js) )

| ![IE / Edge](https://raw.githubusercontent.com/godban/browsers-support-badges/master/src/images/edge.png) <br /> IE / Edge | ![Firefox](https://raw.githubusercontent.com/godban/browsers-support-badges/master/src/images/firefox.png) <br /> Firefox | ![Chrome](https://raw.githubusercontent.com/godban/browsers-support-badges/master/src/images/chrome.png) <br /> Chrome | ![Safari](https://raw.githubusercontent.com/godban/browsers-support-badges/master/src/images/safari.png ) <br /> Safari | ![iOS Safari](https://raw.githubusercontent.com/godban/browsers-support-badges/master/src/images/safari-ios.png) <br />iOS Safari | ![Chrome for Android](https://raw.githubusercontent.com/godban/browsers-support-badges/master/src/images/chrome-android.png) <br/> Chrome for Android |
| --------- | --------- | --------- | --------- | --------- | --------- |
| IE11, Edge | last 2 versions| last 2 versions| last 2 versions| not fully supported | not fully supported


- Public blog ([src](https://foundation.zurb.com/sites/docs/compatibility.html) )

| ![IE / Edge](https://raw.githubusercontent.com/godban/browsers-support-badges/master/src/images/edge.png) <br /> IE / Edge | ![Firefox](https://raw.githubusercontent.com/godban/browsers-support-badges/master/src/images/firefox.png) <br /> Firefox | ![Chrome](https://raw.githubusercontent.com/godban/browsers-support-badges/master/src/images/chrome.png) <br /> Chrome | ![Safari](https://raw.githubusercontent.com/godban/browsers-support-badges/master/src/images/safari.png ) <br /> Safari | ![iOS Safari](https://raw.githubusercontent.com/godban/browsers-support-badges/master/src/images/safari-ios.png) <br />iOS Safari | ![Android](https://raw.githubusercontent.com/godban/browsers-support-badges/master/src/images/chrome-android.png) <br/> Android |
| --------- | --------- | --------- | --------- | --------- | --------- |
| IE9+ | last 2 versions| last 2 versions| last 2 versions|  last 2 versions | 4.4+



### Example: building and running tadween instance
```
go get github.com/microcosm-cc/bluemonday
go get github.com/mattn/go-sqlite3
cd to this_project_directory
go build tadween.go
./tadween -db="db_blog.sqlite" -tdir="./templates/en/" -cert="path to cert" -key="path to key"
#you can run tadween without options and it will use the default settings
./tadween
```

## Why making another blogging platform?
Back in 2016 I had a hard time finding a blogging platform with rich text editor and live posting for my personal use. I wasn't considering markdown because writing in RTL or bidirectional eventually doesn't work, beside its inconvenience. This boiled me down to limited options such as Ghost or Wordpress. Ghost was a markdown only and just recently introduces Rich text editor that doesn't support RTL out of the box. And it is a modern one just like medium.com (which I don't like, formal writing fits with classical, word-processor like editors). Wordpress is built using classical tools such as mysql and php that consume resources and it is far from simplicity if you want to fully customize it. 

Appearently such choices fits more as a full CMS rather than personal use. So making a new one was my way to go. And then a decision to extend it and open source it was made.

## Final notes & Future Work
- **This is an alpha grade, initial release**.  Testing is needed from security perspective to ensure no major vulnerabilities. Moreover, there is definitely room for improvements especially for the text editor. While the draftjs project is well maintained, open-sourced editors that are built on top of it are not.
- I have plans of supporting this project in the long run (if it gets enough attention). The next to-do features to add (on top of my head) is to support draft posts, and improving the editor by fixing some known bugs and adding things like footnotes. Hint: tadween is more towards formal writing.

## Appendix: React text editor project  
react-rte contains almost a clone of its [github repository](https://github.com/sstur/react-rte). I have added a couple of files that manipulate some html element within tadween (editor_en.js, editor_ar.js). You can start from there for editor customization. use "npm run-script build" to transpile those files to functional js. It will be ready at /dist/

