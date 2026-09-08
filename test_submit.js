const fs = require('fs');

const html = fs.readFileSync('D:\\career-intelligence\\frontend\\profile.html', 'utf-8');
const resumeJs = fs.readFileSync('D:\\career-intelligence\\frontend\\js\\resume.js', 'utf-8');

// Using basic regex/inspection to identify if any event listener is missing
const matchForm = resumeJs.match(/resumeFormEl\.addEventListener\("submit"/);
console.log("Submit listener present in resume.js?", !!matchForm);

// Let's find exactly why e.preventDefault() might be missed. Is resumeFormEl defined correctly?
const matchEl = resumeJs.match(/const resumeFormEl = document\.getElementById\("([^"]+)"\)/);
console.log("resumeFormEl ID:", matchEl ? matchEl[1] : "NOT FOUND");

const htmlMatch = html.match(/id="([^"]*resume-form[^"]*)"/);
console.log("Form ID in HTML:", htmlMatch ? htmlMatch[1] : "NOT FOUND");

// Wait, could another script be capturing the submit?
// Check navigation.js or profile.js for any form submit listeners
const profileJs = fs.readFileSync('D:\\career-intelligence\\frontend\\js\\profile.js', 'utf-8');
const navJs = fs.readFileSync('D:\\career-intelligence\\frontend\\js\\navigation.js', 'utf-8');

console.log("Submit listeners in profile.js:", profileJs.match(/\.addEventListener\("submit"/g));
