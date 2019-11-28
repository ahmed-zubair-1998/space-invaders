
function selectPlane(obj) {
    obj.className = "selectBox active";
    console.log(JSON.stringify(document.getElementById('session'), null, 4));
    obj.getElementsByTagName("h4")[0].innerText;
}

function selectLevel(obj) {
    obj.className = "selectBox active";
    session['level'] = obj.getElementsByTagName("h4")[0].innerText;
}