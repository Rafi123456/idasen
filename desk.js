const HEIGHT_SERVICE_UUID = "99fa0020-338a-1024-8a49-009c0215f78a";        
const HEIGHT_CHARACTERISTIC_UUID = "99fa0021-338a-1024-8a49-009c0215f78a"; 

const MOVE_SERVICE_UUID = "99fa0001-338a-1024-8a49-009c0215f78a";
const MOVE_CHARACTERISTI_CUUID = "99fa0002-338a-1024-8a49-009c0215f78a";

const DPG_SERVICE_UUID = '99fa0010-338a-1024-8a49-009c0215f78a'
const DPG_CHARACTERISTIC_UUID = '99fa0011-338a-1024-8a49-009c0215f78a'

const DESK_NAME = 'Desk 0472';

class Desk {

    myDevice;
    server;

    heightCharacteristic;
    moveCharacteristic;
    dpgCharacteristic;

    memory1;
    memory2;
    memory3;

    height;
    destinationHeight;
    destinationDirection;

    updateHeightCallback;

    timerMove;

    async init() {
        try {              
            await this.requestBluetoothDevice();
            await this.initServices();            
        } catch(error) {
            console.log('Argh! ' + error);
            throw error;
        }  
    }


    async initServices() {          
        await this.connectToGattServer();
        await this.initHeightCharacteristic();
        await this.initMoveCharacteristic();
        await this.initDpkgCharacteristic(); 
    }

    async initDpkgCharacteristic() {          
        const dpkgService = await this.server.getPrimaryService(DPG_SERVICE_UUID);
        this.dpgCharacteristic = await dpkgService.getCharacteristic(DPG_CHARACTERISTIC_UUID);
    }

    async initMoveCharacteristic() {          
        const moveService = await this.server.getPrimaryService(MOVE_SERVICE_UUID);
        this.moveCharacteristic = await moveService.getCharacteristic(MOVE_CHARACTERISTI_CUUID);
    }
    
    async connectToGattServer() {          
        this.server = await this.myDevice.gatt.connect();
    }


    async initHeightCharacteristic() {          
        const heightService = await this.server.getPrimaryService(HEIGHT_SERVICE_UUID);        
        this.heightCharacteristic = await heightService.getCharacteristic(HEIGHT_CHARACTERISTIC_UUID);
        await this.heightCharacteristic.startNotifications();
        this.heightCharacteristic.addEventListener('characteristicvaluechanged', (event) => { this.handleHeightNotifications(event);});

        await this.heightCharacteristic.readValue(); //trigger event 
    }

    async requestBluetoothDevice() {    
        console.log('Requesting Bluetooth Device...');     
        this.myDevice = await navigator.bluetooth.requestDevice({
            filters: [{name: DESK_NAME}],
            optionalServices: [HEIGHT_SERVICE_UUID, MOVE_SERVICE_UUID, DPG_SERVICE_UUID]    
        });
    }

    handleHeightNotifications(event) {   
        let value = event.target.value;  
        this.height = (value.getUint8(1) * 256 + value.getUint8(0) + 6200) / 100.0;
        if(this.updateHeightCallback) {
            this.updateHeightCallback();
        }        
    }

    async readMemories() {
        this.memory1 = await this.readMemory(137);        
        this.memory2 = await this.readMemory(138);
        this.memory3 = await this.readMemory(139);        
    }

    async readMemory(number) {
        const uint8 = new Uint8Array(3);
        uint8[0] = 0x7f;
        uint8[1] = number;
        uint8[2] = 0x00;
        await this.dpgCharacteristic.writeValueWithResponse(uint8);  
        let value = await this.dpgCharacteristic.readValue();        
        return this.convertToHeightCm(value);
   
    }

    convertToHeightCm(value) {
        return (value.getUint8(4) * 256 + value.getUint8(3) + 6200) / 100.0;
    }

    setDestinationHeight(dest) {
        this.destinationHeight = dest;  
        if(this.destinationHeight > this.height ) {
            this.destinationDirection = 1;
        } else {
            this.destinationDirection = 0;
        }
    }

    async moveDesk(height) {        
        if( isNaN(height))
            return;  
        clearInterval(this.timerMove);
        this.setDestinationHeight(height);  
        this.timerMove = setInterval(() => { this.timerCallback(); }, 300);        
    }
    

    async up() {
        const order = new Uint8Array(2);
        order[0] = 0x47;
        order[1] = 0x00;
        await this.moveCharacteristic.writeValue(order); 
    }

    async down() {        
        const order = new Uint8Array(2);
        order[0] = 0x46;
        order[1] = 0x00;
        await this.moveCharacteristic.writeValue(order); 
    }

    async stop() {
        clearInterval(this.timerMove);
        const order = new Uint8Array(2);
        order[0] = 0xFF;
        order[1] = 0x00;
        await this.moveCharacteristic.writeValue(order); 
    }

    disconnect() {
        if (this.myDevice) {
            this.myDevice.gatt.disconnect();  
            this.myDevice = null;          
        }
    }

    async timerCallback() { 
        if(this.shouldStop()) { 
            await this.stop();
            console.log('Stop ');
            return;
        }   

        if(this.destinationDirection == 1) { //  up
          await this.up();
        } else {
          await this.down(); 
        }
    }

    shouldStop() {        
        if(this.destinationDirection == 1) { //  up            
            if( this.height >= this.destinationHeight - 0.8) {                   
                return true;     
            } 
        } else {            
            if( this.height <= this.destinationHeight  + 0.8) {
              return true;    
            }       
        }
        return false;
    }

}