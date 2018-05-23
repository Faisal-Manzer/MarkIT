const path = require('path');
const ipc = require('electron').ipcRenderer;
const fs = require('fs');
const remote = require('electron').remote;
const main = remote.require('./main.js');

window.$ = document.querySelector.bind(document);
window.$$ = document.querySelectorAll.bind(document);
Element.prototype.$ = Element.prototype.querySelector;
Element.prototype.$$ = Element.prototype.querySelectorAll;

let simplemde = null;
let workingFile = null;

function initialSetup(){
    let sideNav = $('.sidenav');
    let sideNavIni = M.Sidenav.init(sideNav);
    let collapsible = $('.collapsible');
    let collapsibleIni = M.Collapsible.init(collapsible);

    simplemde = new SimpleMDE({
        autoDownloadFontAwesome: false,
        toolbar: [
            "bold",
            "italic",
            "strikethrough",
            {
                name: "Heading",
                action: SimpleMDE.toggleHeadingSmaller,
                className: "fa fa-heading",
                title: "Heading"
            },
            "|",
            "code",
            "quote",
            "|",
            "unordered-list",
            "ordered-list",
            "|",
            "link",
            {
                name: "Image",
                action: SimpleMDE.drawImage,
                className: "fa fa-image",
                title: "Image"
            },
            "table",
            "horizontal-rule",
            "|",
            "preview",
            "side-by-side",
            "fullscreen"

        ],
        forceSync: true,
        spellChecker: false,
        autofocus: true,
        element: document.getElementById("markdown")
    });
    simplemde.codemirror.on("change", function(){
        $('#mainarea').innerText = simplemde.value();
    });
    simplemde.codemirror.on("change", function(){
       fileOnChange();
    });
    simplemde.toggleSideBySide();
}

document.addEventListener('DOMContentLoaded', () => {
    initialSetup();
    let files = main.openFile();
    console.log(files);
    let fileName = files[0];
    workingFile = fileName;
    fs.readFile(fileName, 'utf-8', function (err, data) {
        simplemde.value(data);
    });
});

function fileOnChange() {
    $('#mainarea').innerText = simplemde.value();
    if(workingFile !== null){
        fs.writeFile(workingFile, simplemde.value(), (err) => {
            if(err !== null)
                alert('Error in saving file: ' + err);
        });
    }
}