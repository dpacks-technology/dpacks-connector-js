// ©2024 DPacks Technology - All Rights Reserved

// Polyfills and Helper Functions
(function () {
    if (!Array.from) {
        Array.from = function (object) {
            return [].slice.call(object);
        };
    }

    if (!Object.keys) {
        Object.keys = (function () {
            const hasOwnProperty = Object.prototype.hasOwnProperty;
            const hasDontEnumBug = !{toString: null}.propertyIsEnumerable('toString');
            const dontEnums = [
                'toString', 'toLocaleString', 'valueOf', 'hasOwnProperty',
                'isPrototypeOf', 'propertyIsEnumerable', 'constructor'
            ];
            const dontEnumsLength = dontEnums.length;

            return function (obj) {
                if (typeof obj !== 'function' && (typeof obj !== 'object' || obj === null)) {
                    throw new TypeError('Object.keys called on non-object');
                }

                let result = [], prop, i;

                for (prop in obj) {
                    if (hasOwnProperty.call(obj, prop)) {
                        result.push(prop);
                    }
                }

                if (hasDontEnumBug) {
                    for (i = 0; i < dontEnumsLength; i++) {
                        if (hasOwnProperty.call(obj, dontEnums[i])) {
                            result.push(dontEnums[i]);
                        }
                    }
                }
                return result;
            };
        })();
    }

    if (!Element.prototype.after) {
        Element.prototype.after = function () {
            const argArr = Array.prototype.slice.call(arguments);
            const docFrag = document.createDocumentFragment();

            argArr.forEach(function (argItem) {
                const isNode = argItem instanceof Node;
                docFrag.appendChild(isNode ? argItem : document.createTextNode(String(argItem)));
            });

            this.parentNode.insertBefore(docFrag, this.nextSibling);
        };
    }
})();

// Main Code
const pageId = document.body.id;
const API_URL = "http://localhost:4000";
const AUTH_API_URL = "http://localhost:4010";

// Login view
const hash = window.location.hash.substr(1);
const user = JSON.parse(localStorage.getItem('user'));

// Default workflow
if (user && user.accessToken) {
    console.log(`Powered by DPacks - Key: ${dpacks_key}`);
    console.log("DPacks: Admin protocol activated");
    admin();
} else {
    (async () => {
        await read();
    })();
}


// ======================== DATA READ SECTION ========================
async function read() {
    const tagsList = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span'];
    const elements = document.querySelectorAll(tagsList);
    const ids = Array.from(elements).map(el => el.id).filter(id => id !== '');

    try {
        const responses = await Promise.all(ids.map(id => axios.get(`${API_URL}/api/v1/data-packets/check/${dpacks_key}/${pageId}/${id}`)));
        const dataResponses = await Promise.all(
            responses.filter(response => response.data.exists === 1)
                .map(response => axios.get(`${API_URL}/api/v1/data-packets/fetch/${dpacks_key}/${pageId}/${response.data.element}`))
        );

        const data = await Promise.all(dataResponses.map(response => response.data));
        data.forEach(item => appendData_read(item.element, item));
    } catch (error) {
        console.error('Error:', error);
    }
}

function appendData_read(id, data) {
    const mainContainer = document.getElementById(id);
    mainContainer.innerText = data.text;

    const attributes = data.attributes;
    if (Object.keys(attributes).length) {
        Object.keys(attributes).forEach(key => {
            mainContainer.setAttribute(key, attributes[key]);
        });
    }
}


// ======================== LOGIN AND AUTHENTICATION SECTION ========================
window.onhashchange = function () {
    const hash = window.location.hash.substr(1);
    if (hash === "dpacks") {
        if (user && user.accessToken) {
            window.location.href = window.location.href.split('#')[0];
        } else {
            createLoginForm();
        }
    }
}

window.onhashchange(); // Handle initial load with hash

function createLoginForm() {
    const loginDiv = document.createElement("div");
    loginDiv.className = "dpacks_login";
    loginDiv.innerHTML = getLoginFormHTML();
    document.body.after(loginDiv);
}

function getLoginFormHTML() {
    return `
        <div class="con-mid" style="width: 100%; min-height: 100vh;" id="dpacks_login_form">
            <div class="con-mid dpacks-login-form-style-line">
                <div class="dpacks_login_box">
                    <img class="dpacks_login_logo" src="https://cdn.jsdelivr.net/gh/dpacks-technology/dpacks-connector-js/dpacks-logo-w.png" alt="logo" />
                    <p class="dpacks_copyright_text" style="color: #fff;">V1.0 - BETA 1</p>
                    <p class="dpacks_copyright_text" style="color: #fff; margin-bottom: 25px;">TECHNICAL PREVIEW</p>
                    <input placeholder="Email" type="text" id="dpacks_login_email">
                    <br/>
                    <input placeholder="Password" type="password" id="dpacks_login_password">
                    <br/>
                    <div id="dpacks-login-bad-credentials" style="display: none; color: #f85149; background-color: #160b0b; border: 1px solid #f85149; margin: 0 10px; font-size: 0.675rem; border-radius: 10px; padding: 10px 20px;">Invalid Credentials</div>
                    <br/>
                    <button onclick="DPacksLogin()" id="dpacks-login-btn">Login</button>
                    <br/>
                    <a href="https://dpacks.space/forgot" class="dpacks_forgot_password">Forgot Password?</a>
                </div>
            </div>
        </div>`;
}

function authHeader() {
    return user && user.accessToken ? {Authorization: `Bearer ${user.accessToken}`} : {};
}

async function DPacksLogin() {
    const loginButton = document.getElementById("dpacks-login-btn");
    const badCredentials = document.getElementById("dpacks-login-bad-credentials");
    const emailField = document.getElementById("dpacks_login_email");
    const passwordField = document.getElementById("dpacks_login_password");

    if (!emailField.value || !passwordField.value) {
        badCredentials.style.display = "block";
        badCredentials.innerText = "Please fill in all fields";
        return;
    }

    loginButton.innerText = "Loading...";
    badCredentials.style.display = "none";

    try {
        const response = await axios.post(`${AUTH_API_URL}/api/auth/signin`, {
            email: emailField.value,
            password: passwordField.value
        });

        localStorage.setItem("user", JSON.stringify(response.data));
        window.location.href = window.location.href.split('#')[0];
        loginButton.innerText = "Login";
    } catch (error) {
        badCredentials.style.display = "block";
        loginButton.innerText = "Login";
        console.error(error);
        badCredentials.innerText = "An error occurred. Please try again.";
    }
}

function DPacksLogOut() {
    localStorage.removeItem("user");
    window.location.href = window.location.href.endsWith('/') ? window.location.href.slice(0, -1) : window.location.href;
}


// ======================== DATA SAVING SECTION ========================
async function dataPacketSave(id, type) {
    const statusElement = document.getElementById(type === 'attribute' ? `attr_save_${id}` : "dpacks-admin-status");
    statusElement.textContent = "Saving...";

    const key = type === 'text' ? 'text' : document.getElementById(`dpacks_attr_key_${id}`).value;
    const value = type === 'text' ? document.getElementById(id).textContent : document.getElementById(`dpacks_attr_key_value_${id}`).value;

    try {
        const response = await axios.put(`${API_URL}/api/v1/data-packets/${dpacks_key}`, {
            element: id,
            page: pageId,
            key,
            value
        }, {headers: authHeader()});

        statusElement.textContent = "Saved";
        if (type === 'attribute') window.location.reload();
        console.log(response);
    } catch (error) {
        statusElement.textContent = "ERROR";
        console.error(error);
        alert(`Error: ${error}`);
    }
}

async function dataCollectionSave() {
    const tagsList = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    const elements = Array.from(document.querySelectorAll(tagsList));
    const ids = elements.filter(el => el.hasAttribute('id')).map(el => el.id);

    await Promise.all(ids.map(id => dataPacketSave(id, 'text').catch(error => {
        console.error(error);
        alert(`Error: ${error}`);
    })));

    await cleaner(ids);
    console.log(ids);
}

// ======================== ADMIN SECTION ========================
// admin login and other css
let css =
        '/*@import url(\'https://fonts.googleapis.com/css2?family=Finger+Paint&display=swap\');*/' + '/*@import url(\'https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+Antique:wght@400;500&display=swap\');*/' + '@font-face {' + 'font-family: \'Zen Kaku Gothic Antique\';' + '    src:  url(\'../fonts/ZenKakuGothicAntique-Regular.ttf\') format(\'ttf\')' + '}' + '@font-face {' + '    font-family: \'Finger Paint\';' + '    src:  url(\'../fonts/FingerPaint-Regular.ttf\') format(\'ttf\')' + '}' + '.con-mid {display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;} ' + '.dpacks_nav_right {right: 0px; position: fixed;}' + '.dpacks_nav_left {left: 0px; position: fixed;}' + '.dpacks_nav_content {width: 280px; background-color: #000A2A; border: 2px solid #737DFF; height: 38px; border-radius: 10px; display: inline-block; box-shadow: 0px 9px 20px 2px #00000075;}' + '@media screen and (max-width: 420px) {.dpacks_nav_logo{display: none;}}' + '.dpacks_nav_content_a {text-decoration: none; margin: 0px 5px; width: 40px; height: 31px; margin-top: 6px; display: inline-block; font-family: \'Finger Paint\', \'Zen Kaku Gothic Antique\', sans-serif; font-weight: 500; background-color: transparent; color: #fff;}' + '.dpacks_nav_content_a:hover {text-decoration: none; background-color: #737DFF; border-top-right-radius: 7px; border-top-left-radius: 7px;} ' +
        '@import url(\'https://fonts.googleapis.com/css2?family=Radio+Canada&display=swap\');' +
        '.dpacks_modal {width: 100vw; ' + 'height: 100vh; ' + 'background-color: #000a2a; ' + 'color: #fff; ' + 'position: fixed; ' + 'top: 0; ' + 'left: 0; ' + 'right: 0; ' + 'overflow-y: scroll; ' + 'z-index: 2147483647; ' + 'font-family: \'Zen Kaku Gothic Antique\', sans-serif !important; ' + 'font-weight: 500; ' + '}' +
        '.dpacks_modal_inner {' + 'background-color: #111541;' + 'border: 1px solid #737DFF; ' + 'margin: 30px; ' + 'padding: 30px; ' + 'border-radius: 10px; ' + 'box-shadow: 0 0 30px 6px #737dff1c;' + '}' +
        '.dpacks_modal_inner textarea, .dpacks_modal_inner input, .dpacks_modal_inner select {' + 'background-color: #000a2a;' + 'padding: 14px;' + 'margin-bottom: 16px;' + 'color: #fff; ' + 'border: 1px solid #414796;' + 'border-radius: 10px;' + 'outline: none; ' + 'box-shadow: none; ' + 'min-width: 150px; ' + '}' +
        '.dpacks_modal_inner textarea {' + 'width: 400px;' + 'height: 200px; ' + 'max-width: 93%; ' + '}' +
        '.dpacks_modal_inner textarea:hover, .dpacks_modal_inner textarea:focus, .dpacks_modal_inner textarea:active, .dpacks_modal_inner input:hover, .dpacks_modal_inner input:focus, .dpacks_modal_inner input:active, .dpacks_modal_inner select:hover, .dpacks_modal_inner select:active, .dpacks_modal_inner select:focus {' + 'outline: none;' + 'box-shadow: none; ' + '}' + '' + '.dpacks_modal_topics {' + 'font-family: \'Finger Paint\', \'Zen Kaku Gothic Antique\', sans-serif;' + '}' + '' + '.modal_element_page_id {' + 'font-size: 12px; ' + 'background-color: #000a2a; ' + 'padding: 5px 10px;' + 'border-radius: 5px;' + '}' + '' + '.dpacks-button {' + 'background-color: #007bff;' + 'color: #fff;' + 'padding: 7px 12px 6px 12px;' + 'border-radius: 10px;' + 'box-shadow: 0px 5px 20px #027bfe45;' + 'border: 1px solid transparent;' + 'border-color: #007bff;' + '}' + '' + '.dpacks-button:hover {' + 'background-color: #0069d9;' + 'box-shadow: 0px 0px 10px #027bfe45;' + '}' + '' + '.dpacks-close-button {' + 'float: right;' + 'width: 80px;' + '}' + '' + '.dpacks-save-button {' + 'margin-top: 10px;' + 'width: 80px;' + '}' +
        '.dpacks-attr-btn {background-color: #000A2A; color: #fff; box-shadow: none; outline: none; border: 2px solid #737DFF; border-radius: 5px; font-size: 12px;}' +
        '.dpacks-attr-btn:hover {cursor: pointer;}' +
        '.dpacks_login {width: 100%; min-height: 100vh; background-color: #000A2A; position: fixed; top: 0px; left: 0px; z-index: 2147483647;}' +
        '.dpacks_login_box {width: 360px;}' +
        '.dpacks_login_logo {width: 250px; margin-bottom: 20px;}' +
        '#dpacks_login_form ::placeholder {' +
        'color: #737DFF;' +
        'font-size: 14px;' +
        '}' +
        '#dpacks_login_form {' +
        'font-family: \'Radio Canada\', sans-serif;' +
        '}' +
        '#dpacks_login_form input, #dpacks_login_form input:focus {' +
        'outline:none; ' +
        'height: 40px; ' +
        'border-top-right-radius: 10px;' +
        'border-top-left-radius: 10px;' +
        'border-color: transparent;' +
        'border-bottom: 2px dashed #737dff87;' +
        'color: #fff !important; ' +
        'background-color: #000f3d; ' +
        'font-weight: 500 !important; ' +
        'text-align: center; ' +
        'width: 280px;' +
        'margin-bottom: 20px;' +
        'padding: 5px 30px;' +
        '}' +
        '#dpacks_login_form input:focus {' +
        'border-bottom: 2px solid #737DFF;' +
        '}' +
        '@media screen and (max-width: 400px) {' +
        '#dpacks_login_form input, #dpacks_login_form input:focus {' +
        'width: 250px;' +
        'padding: 5px 15px;' +
        '}' +
        '}' +
        '@media screen and (max-width: 350px) {' +
        '#dpacks_login_form input, #dpacks_login_form input:focus {' +
        'width: 230px;' +
        'padding: 5px 10px;' +
        '}' +
        '}' +
        '@media screen and (max-width: 1024px) {' +
        '.dpacks-login-form-style-line {' +
        'border: none !important;' +
        '}' +
        '}' +
        '#dpacks_login_form button {' +
        'width: 160px;' +
        'border-color: transparent;' +
        'cursor: pointer;' +
        'border-radius: 10px;' +
        'background-color: #737DFF;' +
        'height: 40px;' +
        'color: #fff;' +
        'margin-top: 20px;' +
        'margin-bottom: 30px;' +
        'box-shadow: 0px 5px 20px #737dff6b' +
        '}' +
        '#dpacks_login_form button:hover {' +
        'box-shadow: none;' +
        '}' +
        '#dpacks_login_form .dpacks_forgot_password {' +
        'color: #737dff;' +
        'text-decoration: none;' +
        'font-size: 11px;' +
        '}' +
        '.dpacks-login-form-style-line {' +
        'height: 100vh;' +
        'width: 50%;' +
        //'border-left: 1px dashed #737dff;' +
        '}' +
        '.dpacks_login_footer {' +
        'background-color: #737dff;' +
        'color: #fff;' +
        'height: 30px;' +
        'left: 0px;' +
        'bottom: 0px;' +
        'position: absolute;' +
        'text-align: center;' +
        'padding-left: 7px;' +
        'padding-right: 7px;' +
        '}' +
        '#dpacks_login_email:hover, #dpacks_login_password:hover {' +
        'border-bottom: 2px solid #737dff87;' +
        '}' +
        '.dpacks_copyright_text{' +
        'text-align: center;' +
        'color: #000A2A;' +
        'font-family: \'Zen Kaku Gothic Antique\', sans-serif;' +
        'font-size: 8px;' +
        'letter-spacing: 4px;' +
        '}' +
        '.attr-control-btn {' +
        'outline: none;' +
        'border: none;' +
        'box-shadow: none;' +
        'margin: 3px 5px 15px 0;' +
        'padding: 5px 10px;' +
        'border-radius: 5px;' +
        '}' +
        '.attr-control-btn:hover {' +
        'cursor: pointer;' +
        '}' +
        '.attr-control-btn-update {' +
        'border: 1px solid #d29922;' +
        'background-color: rgb(22, 11, 11);' +
        'color: #d29922;' +
        '}' +
        '.attr-control-btn-update:hover {' +
        'background-color: #d29922;' +
        'color: #fff;' +
        '}' +
        '.attr-control-btn-del {' +
        'border: 1px solid #f85149;' +
        'background-color: rgb(22, 11, 11);' +
        'color: #f85149;' +
        '}' +
        '.attr-control-btn-del:hover {' +
        'background-color: #f85149;' +
        'color: #fff;' +
        '}' +
        '.dpacks-button:hover {' +
        'cursor: pointer;' +
        '}',

    head = document.head || document.getElementsByTagName('head')[0],
    style = document.createElement('style');
head.appendChild(style);
style.type = 'text/css';
if (style.styleSheet) {
    // This is required for IE8 and below.
    style.styleSheet.cssText = css;
} else {
    style.appendChild(document.createTextNode(css));
}

// admin view
function admin() {

    // menu element
    let header_ele = document.getElementsByTagName("body")[0];
    let div = document.createElement("div");
    div.setAttribute("id", "dpacks-nightly-settings-nav");
    div.setAttribute("class", "con-mid");
    div.setAttribute("style", "position: fixed; z-index: 2147483640; height: 40px; left: 20px; margin: 0px; bottom: 20px!important;");

    div.innerHTML =
        '<div class=\"dpacks_nav_content con-mid\">' +
        '<span style=\"cursor: pointer\" class=\"dpacks_nav_content_a con-mid\" onclick=\"dataCollectionSave()\">💾</span>' +
        '<a class=\"dpacks_nav_content_a con-mid\" href=\"./\">🛠</a>' +
        '<span style=\"cursor: pointer\" class=\"dpacks_nav_content_a con-mid\" onclick=\"hiddenElementsList()\">🙈</span>' +
        '<a class=\"dpacks_nav_content_a con-mid\" href=\"./\" onclick="DPacksLogOut()">👋️</a>' +
        '</div>';

    let div2 = document.createElement("div");
    let div3 = document.createElement("div");
    div2.setAttribute("id", "dpacks-nightly-status-nav");
    div3.setAttribute("id", "dpacks-nightly-attr-instruction-nav");
    div2.setAttribute("class", "con-mid");
    div3.setAttribute("class", "con-mid");
    div2.setAttribute("style", "border: 2px solid #737DFF; position: fixed; z-index: 2147483647; padding: 10px 10px; border-radius: 10px; width: 190px; right: 10px; margin: 0px; top: 10px!important; background-color: #000A2A;");
    div3.setAttribute("style", "border: 2px solid #737DFF; position: fixed; z-index: 2147483647; padding: 10px 10px; border-radius: 10px; width: 190px; right: 10px; margin: 0px; top: 46px!important; background-color: #000A2A;");

    div2.innerHTML =
        //'<img src="./logo.png"  alt="dpacks logo" style="width: 80px;" />' +
        //'<br />' +
        '<span id="dpacks-admin-status" style="font-family: \'Zen Kaku Gothic Antique\', sans-serif; font-size: 8px; letter-spacing: 4px; color: #fff;">ADMIN PROTOCOL</span>';

    div3.innerHTML =
        //'<img src="./logo.png"  alt="dpacks logo" style="width: 80px;" />' +
        //'<br />' +
        '<span id="dpacks-admin-status-2" style="font-family: \'Zen Kaku Gothic Antique\', sans-serif; font-size: 6px; letter-spacing: 1px; color: #fff;">RIGHT CLICK ON THE ELEMENT TO EDIT ATTRIBUTES</span>';

    if (hash !== "dpacks") {
        header_ele.appendChild(div);
        header_ele.appendChild(div2);
        header_ele.appendChild(div3);
    }


// -- class checker --
    let tagsList = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    const jsonData = document.querySelectorAll(tagsList);
    console.log(jsonData);
    for (let i = 0; i < jsonData.length; i++) {

        // -- id checker
        if (jsonData[i].hasAttribute('id')) {

            // -- id declaration --
            let id = jsonData[i].id;

            console.log(id);

            if (id !== 'dpacks-nightly-settings-nav') {
                // get default data
                let curr_element = document.getElementById(id);
                let curr_text = curr_element.innerText;

                axios.get(API_URL + `/api/v1/data-packets/check/${dpacks_key}/${pageId}/${id}`).then(function (response) {
                    if (response.data.exists === 0) {
                        // create data packet
                        async function createJSON() {

                            let formDataTest = {
                                element: id,
                                page: pageId,
                                text: curr_text,
                                attrKey: [],
                                attrValue: []
                            }

                            for (let att, j = 0, atts = jsonData[i].attributes, n = atts.length; j < n; j++) {
                                att = atts[j];
                                if (att.nodeName !== "id") {
                                    formDataTest.attrKey.push(att.nodeName);
                                    formDataTest.attrValue.push(att.nodeValue);
                                }
                            }

                            console.log(formDataTest);

                            axios.post(API_URL + `/api/v1/data-packets/${dpacks_key}`,
                                formDataTest, {
                                    headers: authHeader()
                                }
                            )
                                .then(function (response) {
                                    console.log(response);
                                })
                                .catch(function (error) {
                                    console.log(error);
                                    // alert("Error: " + error);
                                });
                        }

                        createJSON().then(async r => {
                            //await location.reload();
                            console.log("200");
                        }).catch(error => {
                            console.log(error);
                            // alert("Error: " + error);
                        });


                    } else {

                        axios.get(`${API_URL}/api/v1/data-packets/fetch/${dpacks_key}/${pageId}/${id}`).then(response => {
                            appendData(response.data);
                        })

                    } // default start else


                }).catch(function (error) {
                    console.log(error);
                    // alert("Error: " + error);
                });
            }
            // axios get checker


            // -- append data from data files (view fetch) - function -- - NORMAL WEBSITE READ
            function appendData(data) {

                console.log(data);

                if (data.page === pageId && data.element === id) {

                    jsonData[i].setAttribute('contenteditable', 'true');

                    function htmlDecode(input) {
                        let doc = new DOMParser().parseFromString(input, "text/html");
                        return doc.documentElement.textContent;
                    }

                    let mainContainer = document.getElementById(id);
                    mainContainer.innerHTML = htmlDecode(data.text);
                    mainContainer.setAttribute("oncontextmenu", "attrModel(\'" + id + "\'); attrValueCall(\'" + id + "\');");

                    let attrObject = data.attributes;

                    // read all key values in a json object
                    Object.keys(attrObject).forEach(key => {
                        // console.log(key, attrObject[key]);
                        mainContainer.setAttribute(key, attrObject[key]);
                    });

                    let div = document.createElement("div");
                    let div2 = document.createElement("div");
                    let div3 = document.createElement("div");

                    let btn = document.createElement("button");
                    let btn1 = document.createElement("button");
                    let btn2 = document.createElement("button");
                    let btn3 = document.createElement("button");

                    //btn.setAttribute("onClick", "jDataModel(\'" + id + "\')");
                    btn.setAttribute("onClick", "dataPacketSave(\'" + String(id) + "\')");
                    btn1.setAttribute("onClick", "jDataModel(\'" + id + "\')");
                    btn2.setAttribute("onClick", "deleteData(\'" + id + "\')");
                    btn3.setAttribute("oncontextmenu", "attrModel(\'" + id + "\'); attrValueCall(\'" + id + "\');");
                    btn3.setAttribute("class", "dpacks-attr-btn");

                    div2.setAttribute("style", "display: none;");
                    div2.setAttribute("class", "dpacks_modal");

                    div3.setAttribute("style", "display: none;");
                    div3.setAttribute("class", "dpacks_modal");

                    div2.setAttribute("id", "model_" + id);
                    div3.setAttribute("id", "attrModal_" + id);

                    if ($('#' + id).is(":visible") == false || $('#' + id).is(":hidden") == true) {
                        jDataCloseModel_func('jDataCloseModel_hidden');
                        attrCloseModel_func('attrCloseModel_hidden');
                    } else {
                        jDataCloseModel_func('jDataCloseModel');
                        attrCloseModel_func('attrCloseModel');
                    }

                    function jDataCloseModel_func(jDataCloseModel_type) {
                        div2.innerHTML = '<div class=\"dpacks_modal_inner\"><button class="dpacks-button dpacks-close-button" onClick="' + jDataCloseModel_type + '(\'' + String(id) + '\')">Back</button><br><span class=\"dpacks_modal_topics\">Edit content<br><span class=\"modal_element_page_id\"><span style=\"color: #97aeff\">Page ID: </span>' + String(pageId) + ', <span style=\"color: #97aeff\">Element ID: </span>' + String(id) + '<br></span></span>' + '<br><textarea style="font-family: Zen Kaku Gothic Antique, sans-serif;" id="text_' + String(id) + '">' + String(data.text) + '</textarea><br><button class="dpacks-button dpacks-save-button" onclick="dataPacketSave(\'' + String(id) + '\', \'text\')">Save</button></div>';
                    }

                    function attrCloseModel_func(attrCloseModel_type) {
                        div3.innerHTML = '<div class=\"dpacks_modal_inner\">' + '<button class="dpacks-button dpacks-close-button" onClick="' + attrCloseModel_type + '(\'' + String(id) + '\')">Back</button><br><span class=\"dpacks_modal_topics\">Edit attributes<br><span class=\"modal_element_page_id\"><span style=\"color: #97aeff\">Page ID: </span>' + String(pageId) + ', <span style=\"color: #97aeff\">Element ID: </span>' + String(id) + '</span></span>' + '<div id=\"dpack_data_attr_' + id + '\"></div>' + '<br>' + '<div class=\"dpacks_modal_topics\" id="dpacks_modal_topics" style="display: none;"></div>' + '<div id=\"dpacks_attr_div_' + id + '\"></div>' + '<hr style="border-color: #414796;"/><br/>' + '<div id=\"add-new-attr\" style=\"font-family: Zen Kaku Gothic Antique, sans-serif;\">' + 'Add New / Update' + '<br /><br />' + '<input placeholder=\"Attribute name\" style=\"width: 280px;" id=\"dpacks_attr_key_' + id + '\">' + '<br />' + '<textarea placeholder=\"Attribute value\" style=\"max-width: 280px; min-width: 280px; font-family: Zen Kaku Gothic Antique, sans-serif; min-height: 70px; height: 70px;\" id=\"dpacks_attr_key_value_' + id + '\"></textarea>' + '<br><button class="dpacks-button dpacks-save-button" onclick="dataPacketSave(\'' + String(id) + '\', \'attribute\')" id="attr_save_' + id + '">Save</button>' + '</div>' + '</div>' + '<br/><br/><br/>';
                    }

                    mainContainer.after(div);
                    mainContainer.after(div2);
                    mainContainer.after(div3);

                    if (
                        Object.keys(data).length <= 2
                    ) {
                        div.appendChild(btn1);
                        btn1.innerText = 'Add';
                    } else {

                        btn.innerText = 'Save';
                        btn3.innerText = 'A';
                        btn2.innerText = 'Delete';
                    }

                    // Checks CSS content for display:[none|block], ignores visibility:[true|false]
                    // The same works with hidden
                    if ($('#' + id).is(":visible") == false || $('#' + id).is(":hidden") == true) {
                        console.log(id);

                        let ul = document.getElementById("dpacks_hiddenList_ul_element");
                        let name = id;
                        let li = document.createElement('li');
                        li.setAttribute("id", "dpacks_hidden_elements_" + id);

                        li.innerHTML =
                            "<button onclick=\"jDataModel_hidden(\'" + id + "\')\">Edit</button>" +
                            "<button onclick=\"attrModel_hidden(\'" + id + "\');\">Attributes</button>" +
                            "<button onclick=\"deleteData(\'" + id + "\')\">Delete</button>";

                        li.appendChild(document.createTextNode(name));
                        ul.appendChild(li);

                    }

                }
            }
        }
    }

    // hidden elements list
    let mainBody = document.getElementsByTagName("body")[0];
    let hidden_div = document.createElement("div");
    let hidden_ul = document.createElement("ul");
    let hidden_li = document.createElement("li");
    hidden_div.setAttribute("id", "dpacks_hidden_elements");
    //hidden_div.setAttribute("style", "margin-top: 40px!important; display: none; width: 100vw; height: 100vh; background-color: lightgray; position: fixed; top: 0; left: 0; right: 0; overflow-y: scroll; z-index: 99990;");
    hidden_div.setAttribute("style", "display: none;");
    hidden_div.setAttribute("class", "dpacks_modal");
    hidden_div.innerHTML =
        "<div style=\"padding: 20px;\">" +
        "<div>Hidden / Invisible Elements</div>" +
        "<div><button class=\"dpacks-button dpacks-close-button\" onclick=\"hiddenElementsListClose()\">Back</button>" +
        "<div id=\"hiddenList\">" +
        "<ul id=\"dpacks_hiddenList_ul_element\"></ul>" +
        "</div>" +
        "</div>" +
        "</div>";
    mainBody.appendChild(hidden_div);
    let dpacks_hiddenList_ul_element = document.getElementById("dpacks_hiddenList_ul_element");

}

// Admin model control buttons
{
// A 1 -- data editing model - open --
    function jDataModel(id) {
        document.getElementById("dpacks-nightly-status-nav").style.display = "none";
        document.getElementById("dpacks-nightly-attr-instruction-nav").style.display = "none";
        document.getElementById("dpacks-nightly-settings-nav").style.display = "none";

        // attr close
        let model_1 = document.getElementById("attrModal_" + id);
        model_1.style.display = 'none';

        // edit open
        let model = document.getElementById("model_" + id);
        model.style.removeProperty('display');
    }

// A 2 -- data editing model - close --
    function jDataCloseModel(id) {
        document.getElementById("dpacks-nightly-status-nav").style.display = "none";
        document.getElementById("dpacks-nightly-attr-instruction-nav").style.display = "none";
        document.getElementById("dpacks-nightly-settings-nav").style.display = "none";

        // attr close
        let model_1 = document.getElementById("attrModal_" + id);
        model_1.style.display = 'none';

        // edit close
        let model = document.getElementById("model_" + id);
        model.style.display = 'none';
    }

// A 3 -- data attr editing model - open --
    function attrModel(id) {

        document.addEventListener('contextmenu', function (e) {
            e.preventDefault();
        }, false);

        document.getElementById("dpacks-nightly-status-nav").style.display = "none";
        document.getElementById("dpacks-nightly-attr-instruction-nav").style.display = "none";
        document.getElementById("dpacks-nightly-settings-nav").style.display = "none";

        // edit close
        let model_1 = document.getElementById("model_" + id);
        model_1.style.display = 'none';

        // attr open
        let model = document.getElementById("attrModal_" + id);
        model.style.removeProperty('display');
    }

// A 4 -- data attr editing model - close --
    function attrCloseModel(id) {
        document.getElementById("dpacks-nightly-status-nav").style.display = "flex";
        document.getElementById("dpacks-nightly-attr-instruction-nav").style.display = "flex";
        document.getElementById("dpacks-nightly-settings-nav").style.display = "flex";
        // edit close
        let model_1 = document.getElementById("model_" + id);
        model_1.style.display = 'none';

        // attr open
        let model = document.getElementById("attrModal_" + id);
        model.style.display = 'none';
    }

// Hidden elements
// B 1 -- data editing model - open --
    function jDataModel_hidden(id) {
        document.getElementById("dpacks-nightly-status-nav").style.display = "none";
        document.getElementById("dpacks-nightly-attr-instruction-nav").style.display = "none";
        document.getElementById("dpacks-nightly-settings-nav").style.display = "none";

        // attr close
        let model_1 = document.getElementById("attrModal_" + id);
        model_1.style.display = 'none';

        // main div open
        let mainElement = document.getElementById(id);
        mainElement.style.removeProperty('display');
        mainElement.setAttribute("style", "display: inherit!important; visibility: visible!important;");

        // edit open
        let model = document.getElementById("model_" + id);
        model.style.removeProperty('display');
    }

// B 2 -- data editing model - close --
    function jDataCloseModel_hidden(id) {
        document.getElementById("dpacks-nightly-status-nav").style.display = "flex";
        document.getElementById("dpacks-nightly-attr-instruction-nav").style.display = "flex";
        document.getElementById("dpacks-nightly-settings-nav").style.display = "flex";
        // attr close
        let model_1 = document.getElementById("attrModal_" + id);
        model_1.style.display = 'none';

        // main div close
        let mainElement = document.getElementById(id);
        mainElement.setAttribute("style", "display: none;");

        // edit close
        let model = document.getElementById("model_" + id);
        model.style.display = 'none';
    }

// B 3 -- data attr editing model - open --
    function attrModel_hidden(id) {
        document.getElementById("dpacks-nightly-status-nav").style.display = "none";
        document.getElementById("dpacks-nightly-attr-instruction-nav").style.display = "none";
        document.getElementById("dpacks-nightly-settings-nav").style.display = "none";

        // edit close
        let model_1 = document.getElementById("model_" + id);
        model_1.style.display = 'none';

        // main div open
        let mainElement = document.getElementById(id);
        mainElement.style.removeProperty('display');
        mainElement.setAttribute("style", "display: inherit!important; visibility: visible!important;");

        // attr open
        let model = document.getElementById("attrModal_" + id);
        model.style.removeProperty('display');
    }

// B 4 -- data attr editing model - close --
    function attrCloseModel_hidden(id) {
        document.getElementById("dpacks-nightly-status-nav").style.display = "flex";
        document.getElementById("dpacks-nightly-attr-instruction-nav").style.display = "flex";
        document.getElementById("dpacks-nightly-settings-nav").style.display = "flex";
        // edit close
        let model_1 = document.getElementById("model_" + id);
        model_1.style.display = 'none';

        // main div close
        let mainElement = document.getElementById(id);
        mainElement.setAttribute("style", "display: none;");

        // attr open
        let model = document.getElementById("attrModal_" + id);
        model.style.display = 'none';
    }
}

// hidden elements list reveal
function hiddenElementsList() {
    document.getElementById("dpacks-nightly-status-nav").style.display = "none";
    document.getElementById("dpacks-nightly-attr-instruction-nav").style.display = "none";
    document.getElementById("dpacks-nightly-settings-nav").style.display = "none";

    let model = document.getElementById("dpacks_hidden_elements");
    model.style.removeProperty('display');
}

// hidden elements list close
function hiddenElementsListClose() {
    document.getElementById("dpacks-nightly-status-nav").style.display = "flex";
    document.getElementById("dpacks-nightly-attr-instruction-nav").style.display = "flex";
    document.getElementById("dpacks-nightly-settings-nav").style.display = "flex";
    let model = document.getElementById("dpacks_hidden_elements");
    model.style.display = 'none';
}

// Attributes - UI Attribute dashboard
function attrValueCall(id) {
    document.addEventListener('contextmenu', function (e) {
        e.preventDefault();
    }, false);

    let attr_value_div = document.getElementById("dpacks_attr_div_" + id);
    attr_value_div.innerHTML = "";
    let val_select = document.createElement("ul");
    val_select.setAttribute("id", "dpacks_attr_select_" + id);

    axios.get(API_URL + `/api/v1/data-packets/check/${dpacks_key}/${pageId}/${id}`).then(function (response) {


        // append data to webpage
        // fetch(base_url + '/b2/' + dpacks_key + '/' + pageId + '/' + id)
        fetch(`${API_URL}/api/v1/data-packets/fetch/${dpacks_key}/${pageId}/${id}`)
            .then(function (response) {
                return response.json();
            })
            .then(function (data) {
                let array = data.attributes;
                Object.keys(array).forEach(key => {
                    document.getElementById("dpacks_modal_topics").style.display = "block";
                    let node = document.createElement("li");
                    let node2 = document.createElement("button");
                    let node3 = document.createElement("button");
                    let liTextNode = document.createTextNode((key === 'tag_class' ? 'class' : key) + " = " + array[key]);
                    node.appendChild(liTextNode);
                    node2.innerText = "Update";
                    node3.innerText = "Delete";
                    node.setAttribute("id", "li_" + id + "_" + key);
                    node2.setAttribute("onclick", "updateAttr(\"" + id + "\", \"" + key + "\", \"" + array[key] + "\")");
                    node2.setAttribute("class", "attr-control-btn attr-control-btn-update");
                    node2.setAttribute("id", "update_btn_" + id + "_" + key);
                    node3.setAttribute("onclick", "deleteAttr(\"" + id + "\", \"" + key + "\")");
                    node3.setAttribute("class", "attr-control-btn attr-control-btn-del");
                    node3.setAttribute("id", "delete_btn_" + id + "_" + key);
                    val_select.append(node, node2, node3);
                });
            })
            .catch(function (err) {
                console.log('error: ' + err);
                // alert("Error: " + error);
            });

    }).catch(function (error) {
        console.log(error);
        // alert("Error: " + error);
    });

    attr_value_div.appendChild(val_select);
}

// ======================== ATTRIBUTE MANIPULATION SECTION ========================
// update attribute
function updateAttr(id, key, value) {
    document.getElementById("dpacks_attr_key_" + id).value = key;
    document.getElementById("dpacks_attr_key_value_" + id).value = value;
}

// delete attribute
function deleteAttr(id, key) {
    document.getElementById("delete_btn_" + id + "_" + key).innerText = "Deleting..."
    axios.put(API_URL + `/api/v1/data-packets/single-key-remove/${dpacks_key}`, {
        element: id,
        page: pageId,
        key: key
    }, {
        headers: authHeader()
    }).then(function (response) {
        console.log(response);
        document.getElementById("delete_btn_" + id + "_" + key).style.display = "none";
        document.getElementById("update_btn_" + id + "_" + key).style.display = "none";
        document.getElementById("li_" + id + "_" + key).style.display = "none";
        window.location.reload();
    }).catch(function (error) {
        console.log(error);
        // alert("Error: " + error);
    });
}

// ======================== CLEANER SECTION ========================
// -- Cleaner --
function cleaner(elementArray) {
    let formDataTest = {
        page: pageId,
        elementArray: elementArray
    }

    axios.post(API_URL + `/api/v1/data-packets/cleaner/${dpacks_key}`,
        formDataTest, {
            headers: authHeader()
        }
    )
        .then(function (response) {
            console.log(response);
        })
        .catch(function (error) {
            console.log(error);
            // alert("Error: " + error);
        });
}


// -- delete data from json (delete json file) --
function deleteData(id) {
    if (window.confirm('Are you sure you wanna delete all the data of this element?')) {
        axios.delete(API_URL + '/api/v1/json-delete/' + pageId + '/' + id, {
            headers: authHeader()
        }).then(function (response) {
            console.log(response);
        }).catch(function (error) {
            console.log(error);
            // alert("Error: " + error);
        });
    } else {
        console.log("Deletion aborted")
    }
}