document.addEventListener('DOMContentLoaded', function() {
    var elems = document.querySelectorAll('.sidenav');
    var instances = M.Sidenav.init(elems);
    var elemsc = document.querySelectorAll('.collapsible');
    var instancesc = M.Collapsible.init(elemsc);

    var simplemde = new SimpleMDE({
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
        document.querySelector('#mainarea').innerText = simplemde.value();
    });
    simplemde.toggleSideBySide();
});