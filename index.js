const path = require('path');
const ipc = require('electron').ipcRenderer;
const fs = require('fs');
const dialog = require('electron').remote.dialog;
window.$ = document.querySelector.bind(document);
window.$$ = document.querySelectorAll.bind(document);
Element.prototype.$ = Element.prototype.querySelector;
Element.prototype.$$ = Element.prototype.querySelectorAll;

let simplemde = null;
let workingFile = null;
let workingFolder = null;

const sidenav = $('.sidenav');

function initialSetup(){
    M.Sidenav.init(sidenav);
    simplemdeInit();
}

document.addEventListener('DOMContentLoaded', () => {
    initialSetup();
});

ipc.on('open-new-file', () => {openFile()});

ipc.on('winFocusChanged', () => {showFile()});

let openFile = () => {
    let selectedPath = dialog.showOpenDialog({
        properties: [
            'openFile',
            'openDirectory',
            'showHiddenFiles',
            'createDirectory',
            'promptToCreate'
        ]
    });
    if(selectedPath){
        selectedPath = selectedPath[0];

        workingFolder = null;
        workingFile = null;



        if(fs.lstatSync(selectedPath).isDirectory()){
            workingFolder = selectedPath;
        }

        if(fs.lstatSync(selectedPath).isFile()){
            workingFolder = path.dirname(selectedPath);
            workingFile = selectedPath;
        }
    }

    showFile();
    sidenav.setAttribute('data-child', 'false');
    let stats = fs.lstatSync(workingFolder);
    addFolderToFolderStructure({
        path: workingFolder,
        name: path.basename(workingFolder),
        type: (stats.isFile()) ? 'file' : ((stats.isDirectory()) ? 'folder' : null)
    }, sidenav);
};

let showFile = () => {
    if(workingFile){
        fs.readFile(workingFile, 'utf-8', function (err, data) {
            if(!err)
                simplemde.value(data);
        });
    }
};

function fileOnChange() {
    $('#mainarea').innerText = simplemde.value();
    if(workingFile !== null){
        let allImg = $$('.editor-preview-side img');
        for(let i=0;i<allImg.length;i++){
            console.log('pr');
            let src = allImg[i].src;
            src.replace(`${__dirname}/index.html`,workingFolder);
        }
        fs.writeFile(workingFile, simplemde.value(), (err) => {
            if(err)
                alert('Error in saving file: ' + err);
        });
    }
}

/*
function folderStructure(filename, parent) {
    let stats = fs.lstatSync(filename),
        info = {
            path: filename,
            name: path.basename(filename)
        };

    if (stats.isDirectory()) {
        info.type = "folder";
        let secParent = addFolderToFolderStructure(info, parent);
        secParent.onclick = (e) => {
          folderStructure(filename, secParent);
        };
        fs.readdirSync(filename).map(function(child) {
            folderStructure(filename + '/' + child, secParent);
        });
    } else if(stats.isFile()) {
        info.type = 'file';
        addFileToFolderStructure(info, parent);
    }
}
*/

function folderStructure(filename, parent) {
    if(parent.getAttribute('data-child') === ('false' || null || undefined)) {
        parent.setAttribute('data-child', 'true')
        fs.readdirSync(filename).map(function (child) {
            let filePath = filename + '/' + child;
            let stats = fs.lstatSync(filePath);
            let info = {
                path: filePath,
                name: path.basename(filePath),
                type: (stats.isFile()) ? 'file' : ((stats.isDirectory()) ? 'folder' : null)
            };
            if (info.type === 'file')
                addFileToFolderStructure(info, parent);
            if (info.type === 'folder') {
                addFolderToFolderStructure(info, parent);
            }
        });
        M.Collapsible.init(parent.parentNode.parentNode.parentNode);
    }
}

function addFileToFolderStructure(structure, parent) {
    let ele = document.createElement('li');
    parent.appendChild(ele);

    let eleAnc = document.createElement('a');
    ele.appendChild(eleAnc);

    eleAnc.href = '#!';
    eleAnc.setAttribute('data-path', structure.path);
    eleAnc.onclick = (e) => {
        selectFile(eleAnc);
    };

    let eleIcon = document.createElement('i');
    eleAnc.appendChild(eleIcon);

    eleIcon.classList.add('material-icons');
    eleIcon.innerText = 'insert_drive_file';

    let eleSpan = document.createElement('span');
    eleAnc.appendChild(eleSpan);

    eleSpan.innerText = structure.name;
}

function addFolderToFolderStructure(structure, parent) {
    let ele = document.createElement('li');
    parent.appendChild(ele);

    let eleUl = document.createElement('ul');
    ele.appendChild(eleUl);

    eleUl.classList.add('collapsible');
    eleUl.classList.add('expandable');

    let eleUlLi = document.createElement('li');
    eleUl.appendChild(eleUlLi);

    let eleHeader = document.createElement('a');
    eleUlLi.appendChild(eleHeader);

    eleHeader.setAttribute('data-path', structure.path);

    eleHeader.classList.add('collapsible-header');

    eleHeader.innerText = structure.name;

    let eleHeaderIcon = document.createElement('i');
    eleHeader.appendChild(eleHeaderIcon);

    eleHeaderIcon.classList.add('material-icons');
    eleHeaderIcon.innerText = 'folder';


    let eleBody = document.createElement('div');
    eleUlLi.appendChild(eleBody);

    eleBody.classList.add('collapsible-body');

    let eleBodyUl = document.createElement('ul');
    eleBody.appendChild(eleBodyUl);
    eleBodyUl.setAttribute('data-child', 'false');

    eleHeader.onclick = () => {
        folderStructure(structure.path, eleBodyUl);
    };
}

function selectFile(ele) {
    workingFolder = path.dirname(ele.getAttribute('data-path'));
    workingFile = ele.getAttribute('data-path');
    showFile();
}

function simplemdeInit() {
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
        autofocus: false,
        element: document.getElementById("markdown")
    });
    simplemde.codemirror.on("change", function(){
        $('#mainarea').innerText = simplemde.value();
    });
    simplemde.codemirror.on("change", fileOnChange);
    simplemde.toggleSideBySide();
}
