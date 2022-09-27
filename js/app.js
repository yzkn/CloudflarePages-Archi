// Copyright (c) 2022 YA All rights reserved.


const apiUri = 'list.json';
const baseUri = 'https://archit.pages.dev/';

let queries;

const retrieveQueryDict = () => {
    const urlSearchParams = new URLSearchParams(window.location.search);
    return Object.fromEntries(urlSearchParams.entries());
}

const showSpinner = () => {
    document.getElementById('icon-search-spinner').classList.remove('spinner-hidden');
    document.getElementById('icon-search').disabled = true;
}

const hideSpinner = () => {
    document.getElementById('icon-search-spinner').classList.add('spinner-hidden');
    document.getElementById('icon-search').disabled = false;
}

const loadJson = (term = '', ignore_case = false) => {
    showSpinner();

    let imageList = document.getElementById('image-list');
    imageList.innerHTML = '';

    let elementsProcessed = 0;
    fetch(apiUri)
        .then(response => response.json())
        .then(json => {
            // console.log('json', json);

            const filtered = json.tree.filter(function (element, index, array) {
                return (element.type == 'blob' && element.path.startsWith('asset/') && element.path.includes('.png'));
            });
            // console.log('filtered', filtered);

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
            // console.log('filtered2', filtered2);

            if (filtered2.length == 0) {
                hideSpinner();
            } else {

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

                sorted.forEach(element => {
                    let box = document.createElement('div');
                    box.classList.add('position-relative');
                    box.height = 64;
                    box.width = 64;

                    let img = document.createElement('img');
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
                            try {
                                const item = new ClipboardItem({
                                    'image/png': blob
                                });
                                await navigator.clipboard.write([item]);

                                document.getElementById('alert-copied').classList.add('show');
                                setTimeout(() => {
                                    document.getElementById('alert-copied').classList.remove('show');
                                }, 1000);

                            } catch (error) {
                                if (error.message == 'ClipboardItem is not defined') {
                                    document.getElementById('alert-clipboard-item').classList.add('show');
                                }
                            }
                        });
                    };

                    img.onload = () => {
                        const width = img.naturalWidth;
                        const height = img.naturalHeight;
                        const imgSize = String(width) + 'x' + String(height);

                        let captionBox = document.createElement('div');
                        captionBox.classList.add('position-absolute');
                        captionBox.classList.add('bottom-0');
                        captionBox.classList.add('w-100');

                        let captionLabel = document.createElement('p');
                        captionLabel.classList.add('m-0');
                        captionLabel.classList.add('px-1');
                        captionLabel.classList.add('text-end');
                        captionLabel.classList.add('text-light');
                        captionLabel.innerText = imgSize;
                        captionLabel.style.fontSize = '10px';
                        captionLabel.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';

                        box.appendChild(img);
                        captionBox.appendChild(captionLabel);
                        box.appendChild(captionBox);
                        imageList.appendChild(box);


                        elementsProcessed++;
                        if (elementsProcessed === sorted.length) {
                            hideSpinner();
                        }
                    }

                    img.alt = element.path;
                    img.className = 'img-thumbnail';
                    img.crossOrigin = "anonymous";
                    img.title = element.path;

                    img.src = baseUri + element.path;
                });
            }
        });

}

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
