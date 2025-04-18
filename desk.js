const HEIGHT_SERVICE_UUID = "99fa0020-338a-1024-8a49-009c0215f78a";        
const HEIGHT_CHARACTERISTIC_UUID = "99fa0021-338a-1024-8a49-009c0215f78a"; 

const MOVE_SERVICE_UUID = "99fa0001-338a-1024-8a49-009c0215f78a";
const MOVE_CHARACTERISTI_CUUID = "99fa0002-338a-1024-8a49-009c0215f78a";

const DPG_SERVICE_UUID = '99fa0010-338a-1024-8a49-009c0215f78a'
const DPG_CHARACTERISTIC_UUID = '99fa0011-338a-1024-8a49-009c0215f78a'

const DESK_NAME_PREFIX = 'Desk';
const HEIGHT_ERROR = 1.0;
const MIN_DESK_HEIGHT = 6200;
const TIMER_INTERVAL_MS = 700;
const REPEAT_COUNTER = 10;

class Desk {

    #bluetoothDevice;
    #gattServer;

    #heightCharacteristic;
    #moveCharacteristic;
    #dpgCharacteristic;

    #deskMemory1 = 0;
    #deskMemory2 = 0;
    #deskMemory3 = 0;

    #heightCm = 0;
    #destinationHeight = 0;
    #destinationDirectionUp = true;

    #updateHeightCallback;
    #updateInfoCallback;

    #timerMove;

    get currentHeightInCm() {
        return this.#heightCm;
    }

    set heightCallback(callback) {
        this.#updateHeightCallback = callback;
    }

    set infoCallback(callback) {
        this.#updateInfoCallback = callback;
    }

    get isConnected() {
        return this.#bluetoothDevice == null;
    }

    getHeightMemory(number) {
        let memories = [this.#deskMemory1, this.#deskMemory2, this.#deskMemory3];
        return memories[number-1];
    }

    async init() {
        try {              
            await this.#requestBluetoothDevice();
            await this.#initServices();
            await this.#readMemories();            
        } catch(error) {
            console.log('Error! ' + error);
            throw error;
        }  
    }

    async moveDesk(height) {        
        if(isNaN(height)) {
            this.stop();
            return;             
        }           
        
        this.#setDestinationHeight(height);  
        this.#timerMove = setInterval(() => { this.#timerCallback(); }, TIMER_INTERVAL_MS);        
    }

    stop() {
        if(this.#timerMove) {
            clearInterval(this.#timerMove);
            this.#timerMove = null;
            this.#setInfo("Stopped.");
        }
    }

    async #stopCommand() {
        console.log("stop");
		const order = new Uint8Array(2);
        order[0] = 0xFF;
        order[1] = 0x00;		
		await this.#moveCharacteristic.writeValue(order);                     
    }

    async #stopCommandWitRepeat() {
        for(let i = 0; i < REPEAT_COUNTER; i++) {
            try {          
                await this.#stopCommand();
                break;
            } catch(error) {
                // Ignorig errors! 
                console.log('Argh! ' + error);
                await this.#sleep(50);            
            } 
        }            
    }

    async #sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    disconnect() {
        if (this.#bluetoothDevice) {
            this.#bluetoothDevice.gatt.disconnect();  
            this.#bluetoothDevice = null;          
        }
    }

    #setDestinationHeight(dest) {
        this.#destinationHeight = dest;  
        if(this.#destinationHeight > this.#heightCm ) {
            this.#destinationDirectionUp = true;
        } else {
            this.#destinationDirectionUp = false;
        }
    }

    async #initServices() {          
        await this.#connectToGattServer();
        await this.#initHeightCharacteristic();
        await this.#initMoveCharacteristic();
        await this.#initDpkgCharacteristic(); 
        this.#setInfo("Connected.");
    }

    async #initDpkgCharacteristic() {          
        const dpkgService = await this.#gattServer.getPrimaryService(DPG_SERVICE_UUID);
        this.#dpgCharacteristic = await dpkgService.getCharacteristic(DPG_CHARACTERISTIC_UUID);
    }

    async #initMoveCharacteristic() {          
        const moveService = await this.#gattServer.getPrimaryService(MOVE_SERVICE_UUID);
        this.#moveCharacteristic = await moveService.getCharacteristic(MOVE_CHARACTERISTI_CUUID);
    }
    
    async #connectToGattServer() {          
        this.#gattServer = await this.#bluetoothDevice.gatt.connect();
    }

    async #initHeightCharacteristic() {          
        const heightService = await this.#gattServer.getPrimaryService(HEIGHT_SERVICE_UUID);        
        this.#heightCharacteristic = await heightService.getCharacteristic(HEIGHT_CHARACTERISTIC_UUID);
        await this.#heightCharacteristic.startNotifications();
        this.#heightCharacteristic.addEventListener('characteristicvaluechanged', (event) => { this.#handleHeightNotifications(event); });
        await this.#getCurrentHeight();         
    }

    async #getCurrentHeight() {
        let value = await this.#heightCharacteristic.readValue();
        this.#heightCm = this.#convertToHeightCm(value.getUint8(1), value.getUint8(0));  
        this.destinationHeight = this.#heightCm;      
    }

    async #requestBluetoothDevice() {    
        this.#bluetoothDevice = await navigator.bluetooth.requestDevice({
            filters: [{namePrefix: DESK_NAME_PREFIX}],
            optionalServices: [HEIGHT_SERVICE_UUID, MOVE_SERVICE_UUID, DPG_SERVICE_UUID]    
        });
    }

    async #handleHeightNotifications(event) {   
        let value = event.target.value;  
        this.#heightCm = this.#convertToHeightCm(value.getUint8(1), value.getUint8(0));  

        if(this.#weControlDesk() && this.#shouldStop()) {
            this.stop(); 
            this.#stopCommandWitRepeat();                      
        }  

        if(this.#updateHeightCallback) {
            this.#updateHeightCallback();
        }        
    }

    async #readMemories() {
        this.#deskMemory1 = await this.#readMemory(137);        
        this.#deskMemory2 = await this.#readMemory(138);
        this.#deskMemory3 = await this.#readMemory(139);        
    }

    async #readMemory(number) {
        const uint8 = new Uint8Array(3);
        uint8[0] = 0x7f;
        uint8[1] = number;
        uint8[2] = 0x00;
        await this.#dpgCharacteristic.writeValueWithResponse(uint8);  
        let value = await this.#dpgCharacteristic.readValue();      
        return this.#convertToHeightCm(value.getUint8(4), value.getUint8(3));          
    }

    #convertToHeightCm(upperByte, lowerByte) {
        return (upperByte * 256 + lowerByte + MIN_DESK_HEIGHT) / 100.0;
    }  

    async #up() {
        const order = new Uint8Array(2);
        order[0] = 0x47;
        order[1] = 0x00;
        await this.#moveCharacteristic.writeValue(order); 
    }

    async #down() {        
        const order = new Uint8Array(2);
        order[0] = 0x46;
        order[1] = 0x00;
        await this.#moveCharacteristic.writeValue(order); 
    }

    async #timerCallback() { 
        if(this.#shouldStop()) { 
            this.stop();
            return;
        }

        this.#setInfo("Moving ...");

        if(this.#destinationDirectionUp == true) {
            await this.#up();
        } else {
            await this.#down(); 
        }
    }

    #shouldStop() {       
        if(this.#destinationDirectionUp == true) {           
            if( this.#heightCm >= this.#destinationHeight - HEIGHT_ERROR) {           
                return true;     
            } 
        } else {            
            if( this.#heightCm <= this.#destinationHeight + HEIGHT_ERROR) {
              return true;    
            }       
        }
        return false;
    }

    #weControlDesk() {  
        return  this.#timerMove ? true : false;        
    }

    #setInfo(text) {
        const date = new Date();
        const time = date.toLocaleTimeString('en-GB') + `.${date.getMilliseconds()}`;
        //this.info = new Date().toLocaleTimeString('en-GB') + " " + text;
        this.info = time + " " + text;
        if(this.#updateInfoCallback) {
            this.#updateInfoCallback();
        }
    }
}