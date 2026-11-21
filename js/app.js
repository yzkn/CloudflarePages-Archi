// Copyright (c) 2026 YA All rights reserved.


const apiUri = 'list.json';
const baseUri = 'https://archit.pages.dev/';

const materialIconsBaseUri1 = 'https://raw.githubusercontent.com/google/'
const materialIconsBaseUri2 = 'material-design-icons/'
const materialIconsBaseUri3 = 'master/png/'
const materialIconsBaseUri = materialIconsBaseUri1 + materialIconsBaseUri2 + materialIconsBaseUri3 // https://raw.githubusercontent.com/google/material-design-icons/master/png/

const msLearnIconBaseUri = 'https://msico.pages.dev/';

let queries;
let toastDict;

let stored = null;

const basename = path => path.split('/').pop().split('.').shift();

// 出典で絞り込むチップ: 選んだ出典のキー（空なら、すべて）
let selectedSources = new Set();
const connectorSource = 'Power_Platform_Connector';

// path の先頭の部分から出典のキーを作る（asset/<出典>/...・material-design-icons/...・https://msico.pages.dev/...）
const sourceKey = path => path.startsWith(msLearnIconBaseUri)
    ? 'msico'
    : (path.startsWith('asset/') ? path.split('/')[1] : path.split('/')[0]);

// チップに出す名前。無いキーは、記号を空白に置き換えて出す（新しい出典も自動で並ぶ）
const sourceLabels = {
    'Cisco-3015_jpeg': 'Cisco',
    'Dynamics_365_Icons_scalable': 'Dynamics 365',
    'Google_Cloud_Basic_Cards': 'Google Cloud',
    'Microsoft_Fasttrack': 'Microsoft Office App',
    'OpenSecurityArchitecture': 'Open Security Architecture',
    'PowerBI-Icons-main': 'Power BI',
    'Power_Platform_Connector': 'Power Platform コネクタ',
    'Power_Platform_scalable': 'Power Platform',
    'Sakura': 'さくら',
    'Visual_Studio_2022_Image_Library': 'Visual Studio',
    'Yamaha': 'ヤマハ',
    'future-architect': 'Future',
    'material-design-icons': 'Material',
    'msico': 'Microsoft Learn',
};
const sourceLabel = key => sourceLabels[key] || key.replace(/[_-]+/g, ' ');

const renderSourceFilter = (counts, total, term, ignore_case) => {
    const container = document.getElementById('source-filter');
    container.innerHTML = '';

    const makeChip = (label, count, active, onClick) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.classList.add('btn', 'btn-sm', 'rounded-pill', 'text-nowrap', active ? 'btn-secondary' : 'btn-outline-secondary');
        chip.setAttribute('aria-pressed', active ? 'true' : 'false');
        chip.innerText = label + ' ' + count;
        chip.addEventListener('click', onClick);
        container.appendChild(chip);
    };

    makeChip('すべて', total, selectedSources.size === 0, () => {
        selectedSources.clear();
        parseJson(term, ignore_case);
    });
    Object.keys(counts)
        .sort((a, b) => sourceLabel(a).localeCompare(sourceLabel(b), 'ja'))
        .forEach(key => {
            makeChip(sourceLabel(key), counts[key], selectedSources.has(key), () => {
                if (selectedSources.has(key)) {
                    selectedSources.delete(key);
                } else {
                    selectedSources.add(key);
                }
                parseJson(term, ignore_case);
            });
        });

    container.classList.toggle('d-none', Object.keys(counts).length === 0);
};

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

const loadDataSource = () => {
    const items = [
        {
            "url": "https://aws.amazon.com/jp/architecture/icons/",
            "name": "AWS"
        },
        {
            "url": "https://cloud.google.com/icons?hl=ja",
            "name": "Google Cloud"
        },
        {
            "url": "https://emojipedia.org/microsoft/",
            "name": "Segoe UI Emojis"
        },
        {
            "url": "https://fasttrack.microsoft.com/v2/en-us/resources",
            "name": "Microsoft Office App Icons"
        },
        {
            "url": "https://fonts.google.com/icons",
            "name": "Material Symbols"
        },
        {
            "url": "https://github.com/Roemer/plantuml-office",
            "name": "Office"
        },
        {
            "url": "https://github.com/gilbarbara/logos",
            "name": "Logos"
        },
        {
            "url": "https://github.com/kubernetes/community/tree/master/icons",
            "name": "Kubernetes"
        },
        {
            "url": "https://github.com/microsoft/PowerBI-Icons",
            "name": "Power BI Icons"
        },
        {
            "url": "https://learn.microsoft.com/ja-jp/azure/architecture/icons/",
            "name": "Azure アイコン"
        },
        {
            "url": "https://learn.microsoft.com/ja-jp/dynamics365/get-started/icons",
            "name": "Microsoft Dynamics 365 アイコン"
        },
        {
            "url": "https://learn.microsoft.com/ja-jp/entra/architecture/architecture-icons",
            "name": "[Microsoft Entra ID アーキテクチャ アイコン"
        },
        {
            "url": "https://learn.microsoft.com/ja-jp/fabric/fundamentals/icons",
            "name": "Microsoft Fabric アイコン"
        },
        {
            "url": "https://learn.microsoft.com/ja-jp/power-platform/guidance/icons",
            "name": "Power Platform"
        },
        {
            "url": "https://news.microsoft.com/imagegallery/?filter_cats%5B%5D=2333",
            "name": "Microsoft Logos"
        },
        {
            "url": "https://learn.microsoft.com/ja-jp/microsoft-365/solutions/architecture-icons-templates",
            "name": "Microsoft 365 アーキテクチャのアイコンとテンプレート"
        },
        {
            "url": "https://www.microsoft.com/en-us/download/details.aspx?id=35825",
            "name": "Visual Studio Image Library"
        },
        {
            "url": "https://www.opensecurityarchitecture.org/cms/library/icon-library",
            "name": "Open Security Architecture"
        },
        {
            "url": "https://www.cisco.com/c/en/us/about/brand-center/network-topology-icons.html",
            "name": "Cisco Network Topology Icons"
        },
        {
            "url": "https://knowledge.sakura.ad.jp/4724/",
            "name": "さくらのアイコンセット"
        },
        {
            "url": "https://network.yamaha.com/support/download/tool#network_iconset",
            "name": "ヤマハ"
        },
        {
            "url": "https://future-architect.github.io/articles/20160721/",
            "name": "Future"
        }
    ];

    const datasourceList = document.getElementById('datasource-list');
    items.sort((a, b) => a.name > b.name ? 1 : -1).forEach(item => {
        let datasourceItem = document.createElement('div');
        datasourceItem.classList.add('list-group');
        datasourceItem.innerHTML = '<a href="' + item.url + '" target="_blank" class="list-group-item list-group-item-light"> ' + item.name + '</a>';
        datasourceList.appendChild(datasourceItem);
    });
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
                initAutocomplete()
            });
    }
};

const initAutocomplete = () => {
    if (stored != null) {
        const searchList = document.getElementById('search-list');
        const treeItems = stored.tree;
        treeItems.forEach(element => {
            const option = document.createElement('option');
            const item = element.path.replaceAll('/', ' ').replace('.png', '').replace('.svg', '');
            const ssv = item.split(' ');
            option.value = ssv[1] + ' ' + ssv[ssv.length - 1];
            searchList.appendChild(option);
        });
    }
};

const parseJson = (term = '', ignore_case = false) => {
    if (stored == null) {
        setTimeout(() => {
            parseJson(term, ignore_case);
        }, 500);
    } else {
        showSpinner();

        let imageList = document.getElementById('image-list');
        imageList.innerHTML = '';

        let filtered = stored.tree.filter((element) => {
            return ignore_case
                ?
                term.toLowerCase()
                    .split(/\s+/)
                    .map(t => element.path.toLowerCase().includes(t) || element.description.includes(t))
                    .every(t => t === true)
                :
                term.split(/\s+/)
                    .map(t => element.path.includes(t) || element.description.includes(t))
                    .every(t => t === true)
        });

        // 出典ごとの件数（チップに出す）。キーワードで絞ったあと、出典で絞る前の数
        const counts = {};
        filtered.forEach(element => {
            const key = sourceKey(element.path);
            counts[key] = (counts[key] || 0) + 1;
        });
        // 今回の結果に無い出典の選択は外す（チップが消えて外せなくなるため）
        selectedSources.forEach(key => {
            if (!counts[key]) {
                selectedSources.delete(key);
            }
        });

        // Power Platform のコネクタは、?conn=t か、そのチップを選んだときだけ出す
        const showConnector = retrieveQueryDict()['conn'] == 't' || selectedSources.has(connectorSource);
        if (!showConnector) {
            filtered = filtered.filter(element => sourceKey(element.path) !== connectorSource);
        }
        renderSourceFilter(counts, filtered.length, term, ignore_case);

        if (selectedSources.size > 0) {
            filtered = filtered.filter(element => selectedSources.has(sourceKey(element.path)));
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

                    const tsCondition = document.getElementById('icon-copy-transparent-select').value;

                    if (tsCondition == 'lightgray-to-transparent') {
                        ctx.drawImage(img, 0, 0);
                        const imagedata = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const data = imagedata.data;
                        for (let i = 0; i < canvas.width * canvas.height * 4; i += 4) {
                            if (data[i] >= 240 && data[i + 1] >= 240 && data[i + 2] >= 240 && data[i] === data[i + 1] && data[i + 1] === data[i + 2]) {
                                // data[i] = 0;
                                // data[i + 1] = 0;
                                // data[i + 2] = 0;
                                data[i + 3] = 0; // アルファ値を0にして透明にする
                            }
                        }
                        ctx.putImageData(imagedata, 0, 0);
                    } else if (tsCondition == 'white-to-transparent') {
                        ctx.drawImage(img, 0, 0);
                        const imagedata = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const data = imagedata.data;
                        for (let i = 0; i < canvas.width * canvas.height * 4; i += 4) {
                            if (data[i] === 255 && data[i + 1] === 255 && data[i + 2] === 255) {
                                data[i + 3] = 0; // アルファ値を0にして透明にする
                            }
                        }
                        ctx.putImageData(imagedata, 0, 0);
                    } else if (tsCondition == 'white-background') {
                        ctx.beginPath();
                        ctx.fillStyle = 'white';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(img, 0, 0);
                    } else if (tsCondition == 'none') {
                        ctx.drawImage(img, 0, 0);
                    }

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

                    let nameBox = document.createElement('div');
                    nameBox.classList.add('position-absolute');
                    nameBox.classList.add('top-0');
                    nameBox.classList.add('w-100');

                    let nameLabel = document.createElement('p');
                    nameLabel.classList.add('m-0');
                    nameLabel.classList.add('p-0');
                    nameLabel.classList.add('text-start');
                    nameLabel.classList.add('text-nowrap');
                    nameLabel.classList.add('text-light');
                    nameLabel.innerText = basename(element.path);
                    nameLabel.style.transform = "scale(0.5)";
                    nameLabel.style.transformOrigin = "0 0";
                    nameLabel.style.fontSize = '10px';

                    box.appendChild(img);
                    captionBox.appendChild(captionLabel);
                    box.appendChild(captionBox);
                    nameBox.appendChild(nameLabel);
                    box.appendChild(nameBox);
                    imageList.appendChild(box);

                    elementsProcessed++;
                    if (elementsProcessed === sorted.length) {
                        hideSpinner();
                    }
                }

                img.alt = element.path;
                img.className = 'img-thumbnail';
                img.crossOrigin = 'anonymous';
                img.title = element.path + "\n---\n" + element.description + "\n（クリックしてクリップボードにコピー）";
                img.src = element.path.startsWith(msLearnIconBaseUri) ? element.path : (element.path.startsWith(materialIconsBaseUri2) ? element.path.replace(materialIconsBaseUri2, materialIconsBaseUri) : (baseUri + element.path));
            });
        }
    }
};

window.addEventListener('DOMContentLoaded', _ => {
    loadDataSource();

    document.getElementById('icon-search-ignorecase').addEventListener('change', _ => {
        const checked = document.getElementById('icon-search-ignorecase').checked;
        document.getElementById('icon-search-ignorecase-label').innerText = "大文字/小文字を区別"
            + (checked ? "しない" : "する");
    });

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

    // クエリパラメーターをもとに設定: icon-search-ignorecase
    let ic = retrieveQueryDict()['ic'];
    if (ic) {
        if (ic == 't') {
            document.getElementById('icon-search-ignorecase').checked = true;
            document.getElementById('icon-search-ignorecase-label').innerText = "大/小文字を区別しない";
        }
    }

    // クエリパラメーターをもとに設定: icon-copy-transparent-select
    let ts = retrieveQueryDict()['ts'];
    if (ts) {
        if (ts == 'none' || ts == 'white-to-transparent' || ts == 'white-background' || ts == 'lightgray-to-transparent') {
            let optionElement = document.getElementById('icon-copy-transparent-select').querySelector('option[value="' + ts + '"]');
            optionElement.selected = true;
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
