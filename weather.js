(function(){
    const options = {enableHighAccuracy:true, timeout:5000};
    
    if("geolocation" in navigator){
        navigator.geolocation.getCurrentPosition(success, error, options);
    }else{
        alert("MARCHE PO");
    }
})();

async function success(pos){
    const coords = pos.coords;
    const url = `https://fcc-weather-api.glitch.me/api/current?lat=${coords.latitude}&lon=${coords.longitude}`;
    const result = await XHR(url);
    console.log(result);
}
function error(err){
    alert(err);
}
function XHR(url){
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.onload = function(){
            if(this.status >= 200 && this.status < 300){
                resolve(xhr.response);
            }else{
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                });
            }
        };
        xhr.send();
    });
}