
var progress = document.getElementById('file-progress-bar');
var $progress = $('.progress');

var cadCanvas;

// Setup the dnd listeners.
var dropZone = $('.drop-zone');
dropZone.on('dragover', handleDragOver, false);
dropZone.on('drop', onFileSelected, false);

document.getElementById('dxf').addEventListener('change', onFileSelected, false);


function onFileSelected(evt) {
    progress.style.width = '0%';
    progress.textContent = '0%';

    var file = evt.target.files[0];
    var output = [];
    output.push('<li><strong><span id="filename">', encodeURI(file.name), '</span></strong> (', file.type || 'n/a', ') - ',
        file.size, ' bytes, last modified: ',
        file.lastModifiedDate ? file.lastModifiedDate.toLocaleDateString() : 'n/a',
        '</li>');
    document.getElementById('file-description').innerHTML = '<ul>' + output.join('') + '</ul>';

    $progress.addClass('loading');

    var reader = new FileReader();
    reader.onprogress = updateProgress;
    reader.onloadend = onSuccess;
    reader.onabort = abortUpload;
    reader.onerror = errorHandler;
    reader.readAsText(file);
}

function abortUpload() {
    console.log('Aborted read!')
}

function errorHandler(evt) {
    switch(evt.target.error.code) {
    case evt.target.error.NOT_FOUND_ERR:
        alert('File Not Found!');
        break;
    case evt.target.error.NOT_READABLE_ERR:
        alert('File is not readable');
        break;
    case evt.target.error.ABORT_ERR:
        break; // noop
    default:
        alert('An error occurred reading this file.');
    }
}

function updateProgress(evt) {
    console.log('progress');
    console.log(Math.round((evt.loaded /evt.total) * 100));
    if(evt.lengthComputable) {
        var percentLoaded = Math.round((evt.loaded /evt.total) * 100);
        if (percentLoaded < 100) {
            progress.style.width = percentLoaded + '%';
            progress.textContent = percentLoaded + '%';
        }
    }
}

function onSuccess(evt){
    var fileReader = evt.target;
    if(fileReader.error) return console.log("error onloadend!?");
    progress.style.width = '100%';
    progress.textContent = '100%';
    setTimeout(function() { $progress.removeClass('loading'); }, 2000);
    var parser = new window.DxfParser();
    var dxf = parser.parseSync(fileReader.result);
    getParamsParcel(dxf);
    //dxf.bbox = getBBoxDXF(dxf);   
    
}

function handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}

function getParamsParcel(dxf){
    var params = {};
    var referenciaCatastral = document.querySelector('#filename').textContent;
    var pos = referenciaCatastral.indexOf('.');
    var urlParamsParcela = Servicios.ImagenServicio + '/ObtenerParamsParcela?referencia=' + referenciaCatastral.substr(0,pos);
    
    $.ajax({
        url: urlParamsParcela      
      })
      .done(function( data ) {
        
        if (typeof data === "string" && data.length > 0) {
              var arrData = data.split("\n");
              var dataRC = arrData[1].split(',');
              params.bboxArea3D = arrData[2];
              params.dele = dataRC[0];
              params.mapa = dataRC[1]; 
              params.srid = dataRC[2]; 
              params.ancho = dataRC[3]; 
              params.alto = dataRC[4];
              params.urlPlaneTexture = Servicios.ImagenServicio + '/ObtenerImagen?delegacion=' +
                      params.dele + '&mapa=' + params.mapa + '&srid=' + params.srid + '&bbox=' + 
                      params.bboxArea3D.replace(',', '%2C') + '&referencia=' + referenciaCatastral + 
                      '&ancho=' + params.ancho + '&alto=' + params.alto;
              
              dxf.level = getLevelMinMax(dxf); 
              dxf.params = params;         
              cadCanvas = new BabylonDxf.Viewer(dxf, "renderCanvas");

          }
        
      });
  
  return params;
}

function getParamsParcelTest(dxf){
    var params = {};
        /*params.bboxArea3D = "598950,4316275,599025,4316375";
        params.dele = 2;
        params.mapa = 2017; 
        params.srid = 25830; 
        params.ancho = 1125; 
        params.alto = 1500;
        params.bboxArea3D = "442950,4474275,443050,4474350";*/
        params.dele = 28;
        params.mapa = 28271;
        params.srid = 25830;
        params.ancho = 1500;
        params.alto = 1125;
        //params.urlPlaneTexture = "http://10.57.224.240/WsServicios/ImagenServicio.svc/ObtenerImagen?delegacion=2&mapa=2017&srid=25830&bbox=598950%2C4316275,599025,4316375&referencia=9165009WJ9196E&ancho=1125&alto=1500";
        params.urlPlaneTexture = "9165009WJ9196E.png";
        
        dxf.level = getLevelMinMax(dxf); 
        dxf.params = params;         
        cadCanvas = new BabylonDxf.Viewer(dxf, "renderCanvas");
    return params;
}


//OLD function
function getBBoxDXF(data){
    var Xmin = 99999999, Ymin = 99999999;
    var Xmax = 0, Ymax = 0;
    
    data.entities.forEach(function(c){     
      if( c.hasOwnProperty("endPoint") )
      {
        var tempX = c.startPoint.x < c.endPoint.x ? c.startPoint.x : c.endPoint.x; 
        if(tempX < Xmin){ Xmin = tempX; }
        if(tempX > Xmax){ Xmax = tempX; }
        
        var tempY = c.startPoint.y < c.endPoint.y ? c.startPoint.y : c.endPoint.y; 
        if(tempY < Ymin){ Ymin = tempY; }
        if(tempY > Ymax){ Ymax = tempY; } 
      }
      else if(c.hasOwnProperty("vertices")){
        var vcs = c.vertices; 
        vcs.forEach(function(v){
          if(v.x < Xmin){ Xmin = v.x; }
          if(v.x > Xmax){ Xmax = v.x; }
          if(v.y < Ymin){ Ymin = v.y; }
          if(v.y > Ymax){ Ymax = v.y; }
        });
      }
    });
        
     return { Xmin : 598950, Xmax: 599025, Ymin: 4316275 , Ymax: 4316375 };   
    //return { Xmin : Xmin, Xmax : Xmax , Ymin : Ymin, Ymax : Ymax };
}

function getLevelMinMax(data){
  var min = 0, max = 0;
  var onlyPGAA = data.entities.filter(function(e){ return e.layer === "PG-AA" });
  
  onlyPGAA.forEach(function(l){ 
    if( l.text.indexOf('+') > 0){
      
      var pos = l.text.indexOf('+'),
          tempN = RomanNumerals.numerate(l.text.substr(1,pos-1)), //extract negative value beacuse it's contains symbol (-)
          tempP = RomanNumerals.numerate(l.text.substr(pos+1,l.text.length)); //extract positive value      
      if(tempN > min) min = tempN;
      if(tempP > max) max = tempP;
    }
    else{ 
      var tempP = RomanNumerals.numerate(l.text);
      if(tempP > max) max = tempP;
    }
  });
  return { min : min * -1, max : max }
}

var romanNumerals = [['M', 1000],['CM', 900],['D', 500],['CD', 400],['C', 100],['XC', 90],['L', 50],['XL', 40],['X', 10],['IX', 9],['V', 5],['IV', 4],['I', 1]];

    RomanNumerals = {
      romerate: function(foo) {
        var bar = '';
        romanNumerals.forEach(function(buzz) {
          while (foo >= buzz[1]) {
            bar += buzz[0];
            foo -= buzz[1]; 
          }
        });
        return bar;
      },
      numerate: function(x) {
        var y = 0;
        romanNumerals.forEach(function(z) {
          while (x.substr(0, z[0].length) == z[0]) {
            x = x.substr(z[0].length);
            y += z[1];
          }
        });
        return y;
      }
    }