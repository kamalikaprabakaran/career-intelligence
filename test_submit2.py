import subprocess
import os

with open('test_submit.html', 'w', encoding='utf-8') as f:
    f.write("""
<!DOCTYPE html>
<html>
<body>
    <script>
        window.onerror = function(e) { console.log("GLOBAL ERR:", e); };
    </script>
    <div id="no-profile-alert"></div>
    <div id="resume-content"></div>
    <div id="drop-zone"></div>
    <input type="file" id="resume-file" />
    <div id="file-info"></div>
    <div id="file-name"></div>
    <form id="resume-form"></form>
    <button id="upload-btn"></button>
    <div id="parse-loader"></div>
    <div id="upload-err-msg"></div>
    <div id="current-resume-display"></div>
    <div id="current-resume-filename"></div>
    <div id="current-resume-date"></div>
    <div id="current-resume-skills-count"></div>
    <button id="edit-resume-btn"></button>

    <script>
        window.API_BASE_URL = "http://123";
    </script>
    <script src="frontend/js/resume.js"></script>
    <script>
        console.log("SUCCESSFULLY LOADED!");
        document.getElementById('upload-btn').click();
    </script>
</body>
</html>
""")

os.system("node -e \"const jsdom = require('jsdom'); const { JSDOM } = jsdom; JSDOM.fromFile('test_submit.html', { runScripts: 'dangerously', resources: 'usable' }).then(dom => { console.log(dom.window.document.body.innerHTML); }).catch(e => console.log('JSDOM ERR:', e));\"")
