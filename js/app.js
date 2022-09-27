// Copyright (c) 2022 YA All rights reserved.


const apiUri = 'list.json';
const baseUri = 'https://archit.pages.dev/';

let queries;

const retrieveQueryDict = () => {
    const urlSearchParams = new URLSearchParams(window.location.search);
    return Object.fromEntries(urlSearchParams.entries());
}

const loadJson = (term = '', ignore_case = false) => {
    fetch(apiUri)
        .then(response => response.json())
        .then(json => {
            const filtered = json.tree.filter(function (element, index, array) {
                return (element.type == 'blob' && element.path.startsWith('asset/') && element.path.includes('.png'));
            });

            const filtered2 = filtered.filter(function (element, index, array) {
                return ignore_case
                    ?
                    term.toLowerCase()
                        .split(/\s+/)
                        .map(t => element.path.toLowerCase().includes(t))
                        .every(t => t === true)
                    :
                    term.split(/\s+/)
                        .map(t => element.path.includes(t))
                        .every(t => t === true)
            });

            const sorted = filtered2.sort(function (a, b) {
                const na = a.path.toUpperCase();
                const nb = b.path.toUpperCase();
                if (na < nb) {
                    return -1;
                } else if (na > nb) {
                    return 1;
                } else {
                    return 0;
                }
            });

            let imageList = document.getElementById('image-list');
            imageList.innerHTML = '';

            sorted.forEach(element => {
                let img = document.createElement('img');
                img.alt = element.path;
                img.className = 'img-thumbnail';
                img.crossOrigin = "anonymous";
                img.height = 64;
                img.src = baseUri + element.path;
                img.title = element.path;
                img.width = 64;
                img.onclick = (event) => {
                    const img = event.target;
                    const canvas = document.createElement('canvas');
                    canvas.width = img.naturalWidth;
                    canvas.height = img.naturalHeight;
                    const ctx = canvas.getContext('2d');

                    ctx.beginPath();
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    ctx.drawImage(img, 0, 0);
                    canvas.toBlob(async (blob) => {
                        const item = new ClipboardItem({
                            'image/png': blob
                        });
                        await navigator.clipboard.write([item]);

                        document.getElementById('alert-copied').classList.add('show');
                        setTimeout(() => {
                            document.getElementById('alert-copied').classList.remove('show');
                        }, 1000);
                    });
                };

                imageList.appendChild(img);
            });
        });
};

window.addEventListener('DOMContentLoaded', (event) => {
    document.querySelectorAll('.alert').forEach((alert) => new bootstrap.Alert(alert));

    let ic = retrieveQueryDict()['ic'];
    if (ic) {
        if (ic == 't') {
            document.getElementById('icon-search-ignorecase').checked = true;
        }
    }

    let term = retrieveQueryDict()['term'];
    if (term) {
        bootstrap.Alert.getInstance(document.getElementById('alert-input-keyword')).close();

        document.getElementById('icon-search-term').value = term;

        loadJson(
            term,
            document.getElementById('icon-search-ignorecase').checked
        );
    } else {
        document.getElementById('alert-input-keyword').classList.add('show');
        setTimeout(() => {
            bootstrap.Alert.getInstance(document.getElementById('alert-input-keyword')).close()
        }, 3000);
    }

    document.getElementById('icon-search').addEventListener('click', (event) => {
        loadJson(
            document.getElementById('icon-search-term').value,
            document.getElementById('icon-search-ignorecase').checked
        );
    });

    document.getElementById('icon-search-term').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('icon-search').dispatchEvent(new Event('click'));
        }
    });
});
