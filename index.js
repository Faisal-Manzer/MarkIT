const path = require('path');
const ipc = require('electron').ipcRenderer;
const fs = require('fs');
const remote = require('electron').remote;
const dialog = remote.dialog;

window.$ = document.querySelector.bind(document);
window.$$ = document.querySelectorAll.bind(document);
Element.prototype.$ = Element.prototype.querySelector;
Element.prototype.$$ = Element.prototype.querySelectorAll;

let simplemde = null;
let workingFile = null;
let workingFoler = null;
let folderStucture = null;

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

ipc.on('open-new-file', (e, args) => {
    openFile();
});

const openFile = () => {

    function dirTree(filename) {
        let stats = fs.lstatSync(filename),
            info = {
                path: filename,
                name: path.basename(filename)
            };

        if (stats.isDirectory()) {
            info.type = "folder";
            info.children = fs.readdirSync(filename).map(function(child) {
                return dirTree(filename + '/' + child);
            });
        } else {
            // Assuming it's a file. In real life it could be a symlink or
            // something else!
            info.type = "file";
        }

        return info;
    }

    let selectedPath = dialog.showOpenDialog({
        properties: [
            'openFile',
            'openDirectory',
            'multiSelections',
            'showHiddenFiles',
            'createDirectory',
            'promptToCreate'
        ]
    });

    if(selectedPath !== null){
        selectedPath = selectedPath[0];

        workingFoler = null;
        workingFile = null;
        folderStucture = null;

        if(fs.lstatSync(selectedPath).isDirectory()){
            workingFoler = selectedPath;
        }

        if(fs.lstatSync(selectedPath).isFile()){
            workingFoler = path.dirname(selectedPath);
            workingFile = selectedPath;
        }

        folderStucture = dirTree(workingFoler);
        console.log(folderStucture);
    }

    showFile();
};

let showFile = () => {
    if(workingFile !== null){
        fs.readFile(workingFile, 'utf-8', function (err, data) {
            simplemde.value(data);
        });
    }
}