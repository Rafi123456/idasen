var desk = new Desk();
desk.heightCallback = updateHeight;
desk.infoCallback =  updateHInfo;

    
async function initDesk() {
    await desk.init();    
    setMemoriesUi();
}

function updateHeight() {
    const div = document.getElementById("height");  
    div.innerHTML = "" + desk.currentHeightInCm;
}

function updateHInfo() {
    const div = document.getElementById("info");  
    div.innerHTML = "" + desk.info;
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
    await desk.moveDesk(desk.getHeightMemory(1));  
}
    
async function m2() {
    await desk.moveDesk(desk.getHeightMemory(2));  
}

async function m3() {
    await desk.moveDesk(desk.getHeightMemory(3));  
}

function setMemoriesUi() {
    let div = document.getElementById("m1");    
    div.innerHTML = "" + desk.getHeightMemory(1);


    div = document.getElementById("m2");      
    div.innerHTML = "" + desk.getHeightMemory(2);

    div = document.getElementById("m3");  
    div.innerHTML = "" + desk.getHeightMemory(3);
}

function clearMemoriesUi() {
    let div = document.getElementById("m1");  
    div.innerHTML = "";

    div = document.getElementById("m2");      
    div.innerHTML = "";

    div = document.getElementById("m3");  
    div.innerHTML = "";
}