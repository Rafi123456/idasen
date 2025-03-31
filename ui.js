var desk = new Desk();
desk.heightCallback = updateHeight;
desk.infoCallback =  updateHInfo;
 

    
async function initDesk() {    
    await desk.init();
    disableUi(false);  
    setMemoriesUi();
}

function stop() {    
    desk.stop();         
}



function disconnect() {
    desk.stop();     
    desk.disconnect();
    disableUi(true);     
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

function disableUi(disabled) {
    document.getElementById("bdisconnect").disabled = disabled;
    document.getElementById("bstop").disabled = disabled;

    document.getElementById("bsitL").disabled = disabled;
    document.getElementById("bsitH").disabled = disabled;
    document.getElementById("bstand").disabled = disabled;

    document.getElementById("bmax").disabled = disabled;

    document.getElementById("bm1").disabled = disabled;
    document.getElementById("bm2").disabled = disabled;
    document.getElementById("bm3").disabled = disabled;

    

}

function setMemoriesUi() {
    let div = document.getElementById("m1");    
    div.value = "" + desk.getHeightMemory(1);


    div = document.getElementById("m2");      
    div.value = "" + desk.getHeightMemory(2);

    div = document.getElementById("m3");  
    div.value = "" + desk.getHeightMemory(3);
}

function clearMemoriesUi() {
    let div = document.getElementById("m1");  
    div.value = "";

    div = document.getElementById("m2");      
    div.value = "";

    div = document.getElementById("m3");  
    div.value = "";
}