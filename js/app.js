// Copyright (c) 2022 YA All rights reserved.


const apiUri = 'list.json';
const baseUri = 'https://archit.pages.dev/';

const materialIconsBaseUri1 = 'https://raw.githubusercontent.com/google/'
const materialIconsBaseUri2 = 'material-design-icons/'
const materialIconsBaseUri3 = 'master/png/'
const materialIconsBaseUri = materialIconsBaseUri1 + materialIconsBaseUri2 + materialIconsBaseUri3 // https://raw.githubusercontent.com/google/material-design-icons/master/png/

let queries;
let toastDict;

let stored = null;

const retrieveQueryDict = () => {
    const urlSearchParams = new URLSearchParams(window.location.search);
    return Object.fromEntries(urlSearchParams.entries());
};

const showSpinner = () => {
    document.getElementById('icon-search-spinner').classList.remove('spinner-hidden');
    document.getElementById('icon-search').disabled = true;
};

const hideSpinner = () => {
    document.getElementById('icon-search-spinner').classList.add('spinner-hidden');
    document.getElementById('icon-search').disabled = false;
};

const loadJson = (term = '', ignore_case = false) => {
    if (stored != null) {
        parseJson(term, ignore_case)
    } else {
        fetch(apiUri)
            .then(response => response.json())
            .then(json => {
                stored = json;
                parseJson(term, ignore_case)
            });
    }
};

const parseJson = (term = '', ignore_case = false) => {
    showSpinner();

    let imageList = document.getElementById('image-list');
    imageList.innerHTML = '';

    let filtered = stored.tree.filter((element) => {
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

    let conn = retrieveQueryDict()['conn'];
    if (conn) {
        if (conn == 't') {
            console.log('conn');
        } else {
            filtered = filtered.filter((element) => {
                return (!element.path.includes('asset/Power_Platform_Connector/'));
            });
        }
    } else {
        filtered = filtered.filter((element) => {
            return (!element.path.includes('asset/Power_Platform_Connector/'));
        });
    }
    if (filtered.length == 0) {
        hideSpinner();
    } else {
        const sorted = filtered.sort((a, b) => {
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

        let elementsProcessed = 0;
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
                        toastDict['toast-copied'].show();
                    } catch (error) {
                        if (error.message == 'ClipboardItem is not defined') {
                            toastDict['toast-clipboard-item'].show();
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
                captionLabel.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
                captionLabel.style.fontSize = '10px';

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

            img.src = element.path.startsWith(materialIconsBaseUri2) ? element.path.replace(materialIconsBaseUri2, materialIconsBaseUri) : (baseUri + element.path);
        });
    }
};

window.addEventListener('DOMContentLoaded', _ => {
    document.querySelectorAll('.alert').forEach((alert) => new bootstrap.Alert(alert));
    toastDict = {
        'toast-copied': new bootstrap.Toast(document.getElementById('toast-copied'), {
            delay: 500,
        }),
        'toast-input-keyword': new bootstrap.Toast(document.getElementById('toast-input-keyword'), {
            delay: 2000,
        }),
        'toast-clipboard-item': new bootstrap.Toast(document.getElementById('toast-clipboard-item'), {
            autohide: false
        })
    };

    let ic = retrieveQueryDict()['ic'];
    if (ic) {
        if (ic == 't') {
            document.getElementById('icon-search-ignorecase').checked = true;
        }
    }

    let term = retrieveQueryDict()['term'];
    if (term) {
        document.getElementById('icon-search-term').value = term;

        loadJson(
            term,
            document.getElementById('icon-search-ignorecase').checked
        );
    } else {
        toastDict['toast-input-keyword'].show();
    }

    document.getElementById('icon-search').addEventListener('click', _ => {
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
