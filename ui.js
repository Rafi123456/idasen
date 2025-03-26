var desk = new Desk();
desk.updateHeightCallback = updateHeight;
    
async function initDesk() {
    await desk.init();
    await desk.readMemories();
    setMemoriesUi();
}

function updateHeight() {
    const div = document.getElementById("height");  
    div.innerHTML = "" + this.height;
}

async function stand() {
    await pressed("stand");  
}

async function sitL() {
    await pressed("sitL");    
}

async function sitH() {
    await pressed("sitH");   
}

async function max() {
    await pressed("max");
}

async function pressed(fieldId) {
    var a = document.getElementById(fieldId);  
    let field = parseFloat(a.value)
    if(isNaN(field))
        return;  
    console.log(field); 
    await desk.moveDesk(field);    
}

async function m1() {
    await this.moveDesk(desk.memory1);  
}
    
async function m2() {
    await this.moveDesk(desk.memory2);  
}

async function m3() {
    await this.moveDesk(desk.memory3);  
}

function setMemoriesUi() {
    let div = document.getElementById("m1");  
    div.innerHTML = "" + desk.memory1;

    div = document.getElementById("m2");      
    div.innerHTML = "" + desk.memory2;

    div = document.getElementById("m3");  
    div.innerHTML = "" + desk.memory3;
}

function clearMemoriesUi() {
    let div = document.getElementById("m1");  
    div.innerHTML = "";

    div = document.getElementById("m2");      
    div.innerHTML = "";

    div = document.getElementById("m3");  
    div.innerHTML = "";
}