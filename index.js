const path = require('path');
const ipc = require('electron').ipcRenderer;
const fs = require('fs');
const dialog = require('electron').remote.dialog;
window.$ = document.querySelector.bind(document);
window.$$ = document.querySelectorAll.bind(document);
Element.prototype.$ = Element.prototype.querySelector;
Element.prototype.$$ = Element.prototype.querySelectorAll;

let mde = null;
let workingFile = null;
let workingFolder = null;

const sidenav = $('.sidenav');
let sidenavIni = null;

function initialSetup(){
    sidenavIni = M.Sidenav.init(sidenav);
    mdeInit();
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
        let ext = path.extname(workingFile);
        if(ext)
        fs.readFile(workingFile, 'utf-8', function (err, data) {
            if(!err)
                mde.value(data);
        });
    }
};

function fileOnChange() {
    $('#mainarea').innerText = mde.value();
    if(workingFile !== null){
        let allImg = $$('.editor-preview-side img');
        for(let i=0;i<allImg.length;i++){
            console.log('pr');
            let src = allImg[i].src;
            src.replace(`${__dirname}/index.html`,workingFolder);
        }
        fs.writeFile(workingFile, mde.value(), (err) => {
            if(err)
                alert('Error in saving file: ' + err);
        });
    }
}

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
    eleAnc.setAttribute('draggable', 'false');
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

    eleSpan.innerText = structure.name.replace(/ +/g, '');
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

function mdeInit() {
    mde = new SimpleMDE({
        autoDownloadFontAwesome: false,
        toolbar: [
            {
                name: "folder structure",
                action: () => {
                    alert("qq")
                },
                className: "fas fa-sitemap active"
            },
            {
                name: "theme",
                action: () => {
                    alert('change theme');
                },
                className: "fas fa-adjust"
            },
            "|",
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
        renderingConfig: {
            codeSyntaxHighlighting: true
        },
        element: document.getElementById("markdown")
    });
    mde.codemirror.on("change", function(){
        $('#mainarea').innerText = mde.value();
    });
    // $('.fixed-action-btn').onclick = () => {
    //     mde.codemirror.setOption('theme', 'paper');
    //     document.body.style.padding = '0';
    //     $('.editor-preview-side').style.width = '50%';
    //     sidenavIni.close();
    // };
    mde.codemirror.on("change", fileOnChange);
    mde.toggleSideBySide();
}
