var BabylonDxf;
(function (BabylonDxf) {

  BabylonDxf.Viewer = function (data, element) {

    var canvas = document.getElementById(element);
    var engine = new BABYLON.Engine(canvas, true);
    var width = canvas.clientWidth;
    var height = canvas.clientHeight;
    
    var bbox = data.params.bboxArea3D.split(',');
    var XminMapa = parseFloat(bbox[0]),
        YminMapa = parseFloat(bbox[1]),
        XmaxMapa = parseFloat(bbox[2]),
        YmaxMapa = parseFloat(bbox[3]);
        
    var widthArea3D = (XmaxMapa - XminMapa),
        heightArea3D = (YmaxMapa - YminMapa),
        XmedMapa = (XmaxMapa + XminMapa) / 2,
        YmedMapa = (YmaxMapa + YminMapa) / 2;

    function createScene(data, engine) {

      var scene = new BABYLON.Scene(engine);
      scene.clearColor = new BABYLON.Color3(0.8, 0.8, 0.8);

      var camera = new BABYLON.ArcRotateCamera("Camera", 3 * Math.PI / 2, Math.PI / 2, 50, BABYLON.Vector3.Zero(), scene);
      camera.setTarget(new BABYLON.Vector3(-4, 2, 2)); // This targets the camera to scene origin
      camera.attachControl(canvas, false);

      var light0 = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
      light0.diffuse = BABYLON.Color3.White();
      light0.specular = BABYLON.Color3.White();

      var pl = new BABYLON.PointLight("pl", new BABYLON.Vector3.Zero(), scene);
      pl.diffuse = new BABYLON.Color3(1, 1, 1);
      pl.intensity = 0.6;
              
      //Creation of a plane
      /*var plane = BABYLON.Mesh.CreatePlane("plane", 40, scene);
      plane.position.y = 0;
      plane.rotation.x = Math.PI / 2;*/
        
      /*******************************************************************************/
      // Parameters
      var xmin = (widthArea3D / 2) * -1;
      var zmin = (heightArea3D / 2) * -1;
      var xmax = widthArea3D / 2;
      var zmax = heightArea3D / 2;
      var precision = {
        "w": 2,
        "h": 2
      };
      var subdivisions = {
        'h': 1,
        'w': 1
      };
      // Create the Tiled Ground
      var tiledGround = new BABYLON.Mesh.CreateTiledGround("Tiled Ground", xmin, zmin, xmax, zmax, subdivisions, precision, scene);
        
      // Create Multi Material
      var multimat = new BABYLON.MultiMaterial("multi", scene);

      for (var row = 0; row < subdivisions.h; row++) {
        for (var col = 0; col < subdivisions.w; col++) {
          var material = new BABYLON.StandardMaterial(
            "material" + row + "-" + col,
            scene
            );
          material.diffuseTexture = new BABYLON.Texture(                
            data.params.urlPlaneTexture,            
            scene
            );
          material.diffuseTexture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
          material.diffuseTexture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
          material.specularColor = new BABYLON.Color4(0, 0, 0, 0);
          material.backFaceCulling = false;
          multimat.subMaterials.push(material);
        }
      }
        

      // Part 3 : Apply the multi material
      // Define multimat as material of the tiled ground
      tiledGround.material = multimat;        

      //Creation of a repeated textured material
      /*var materialPlane = new BABYLON.StandardMaterial("texturePlane", scene);
      materialPlane.diffuseTexture = new BABYLON.Texture("../../Assets/floor2.jpg", scene);
      materialPlane.diffuseTexture.uScale = 5.0;//Repeat 5 times on the Vertical Axes
      materialPlane.diffuseTexture.vScale = 5.0;//Repeat 5 times on the Horizontal Axes
      materialPlane.backFaceCulling = false;
      plane.material = materialPlane;*/

      var mat = new BABYLON.StandardMaterial("mat1", scene);
      mat.alpha = 1;
      mat.diffuseTexture = new BABYLON.Texture("../../Assets/brick3.jpg", scene);
      mat.diffuseTexture.uScale = 2.5;//Repeat 5 times on the Vertical Axes
      mat.diffuseTexture.vScale = 2.5;//Repeat 5 times on the Horizontal Axes
      mat.backFaceCulling = false;
      mat.wireframe = false;
        
      /*mat.maxsimultaneousLights = 2;*/
        
      /**********************************************/

      var drawEntity1 = function (entity, data) {
        drawTest(entity, data);
      }

      var drawEntity = function (entity, data) {
        if (entity.type === 'CIRCLE' || entity.type === 'ARC') {
          drawCircle(entity, data);
        } else if (entity.type === 'LINE') { //if(entity.type === 'LWPOLYLINE' || entity.type === 'LINE' || entity.type === 'POLYLINE') {
          drawLine(entity, data);
        } else if (entity.type === 'POLYLINE') {
          //console.log("POLY:" + entity.layer);
          /*if(entity.layer.indexOf("-LT") > 0) {
            drawLine(entity, data); }
          else {*/
          drawPolyLine(entity, data);
        } else if (entity.type === 'TEXT') {
          //if(entity.layer === "PG-CO")
          //  console.log("Layer:"+ entity.layer + " - TEXT:" + entity.text);              
          drawText(entity, data);
        } else if (entity.type === 'SOLID') {
          drawSolid(entity, data);
        } else if (entity.type === 'POINT') {
          drawPoint(entity, data);
        }
      };
        
      //*Anthony*//
      function toScreenCoordinates(Xterreno, Yterreno) {
        var coords, Xposition, Yposition;
        
        

        Xposition = widthArea3D * (Xterreno - XmedMapa) / widthArea3D;
        Yposition = heightArea3D * (Yterreno - YmedMapa) / heightArea3D;

        coords = { x: parseFloat(Xposition), y: parseFloat(Yposition) }

        return (coords);
      }


      function getCurrentLevel(elem, levelmin) {
        var pos = elem.indexOf('-');
        var ind = parseInt(elem.substr(2, pos - 1));
        var floor = levelmin > 0 ? ind : (ind + levelmin);
        if (floor <= 0) floor -= 1;

        return floor;
      }

      function drawTest(entity, data) {
        var path1 = [],
            path2 = [];
        
        // create geometry
        path1.push(new BABYLON.Vector3(-13.7, 0, 17));
        path1.push(new BABYLON.Vector3(-4.9, 0, -9));

        var lines = BABYLON.Mesh.CreateLines("Linesbottom", path1, scene);
        lines.color = new BABYLON.Color3(1, 1, 0);
            
        // create geometry
        path2.push(new BABYLON.Vector3(-23.4, 0, -4.2));
        path2.push(new BABYLON.Vector3(4.5, 0, 12.5));

        var lines = BABYLON.Mesh.CreateLines("Linesbottom", path2, scene);
        lines.color = new BABYLON.Color3(1, 1, 0);
      }


      function drawText(entity, data) {
        var text = entity.text;
        var level = entity.layer.indexOf('PG') > -1 ? 1 : getCurrentLevel(entity.layer, data.level.min);

        var dynamicTexture = new BABYLON.DynamicTexture("DynamicTexture", 260, scene, true);
        dynamicTexture.drawText(text, 5, 100, "bold 72px Arial", "black", "transparent", false);

        var spriteManager = new BABYLON.SpriteManager("sm", "", 1, 300, scene);
        spriteManager.texture = dynamicTexture;
        spriteManager.texture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
        spriteManager.texture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
        var spriteLabel = new BABYLON.Sprite("textSprite", spriteManager);

        var vertex = entity.startPoint;
        var position = toScreenCoordinates(vertex.x, vertex.y);

        spriteLabel.size = 2;
        spriteLabel.position = new BABYLON.Vector3(position.x, (3 * level) - (level < 0 ? -1.5 : 1.5), position.y)
      }

      function drawLine(entity, data) {
        var path1 = [];
        var level = entity.layer.indexOf('PG') > -1 ? 1 : getCurrentLevel(entity.layer, data.level.min);
            
        // create geometry
        for (var i = 0; i < entity.vertices.length; i++) {
          var vertex = entity.vertices[i];
          var position = toScreenCoordinates(vertex.x, vertex.y);
          path1.push(new BABYLON.Vector3(position.x, (3 * level) - (level < 0 ? -3 : 3), position.y));
        }

        var lines = BABYLON.Mesh.CreateLines("Linesbottom", path1, scene);
        lines.color = new BABYLON.Color3(1, 1, 0);
      }


      function drawPolyLine(entity, data) {
        if (entity.layer.indexOf("-LT") > 0) { return false; }

        var path1 = [],
          path2 = [];
        var level = getCurrentLevel(entity.layer, data.level.min);
            
        // create geometry
        for (var i = 0; i < entity.vertices.length; i++) {
          var vertex = entity.vertices[i];
          var position = toScreenCoordinates(vertex.x, vertex.y);
          path1.push(new BABYLON.Vector3(position.x, (3 * level) - (level < 0 ? -3 : 3), position.y));
          path2.push(new BABYLON.Vector3(position.x, (3 * level), position.y));
        }
        //if(entity.shape) geometry.vertices.push(geometry.vertices[0]);

        // set material
        if (entity.layer.indexOf("-LI") > 0) {
          var materialLI = new BABYLON.StandardMaterial("mat1", scene);
          materialLI.diffuseTexture = new BABYLON.Texture("../../Assets/wall-white.jpg", scene);
          materialLI.diffuseTexture.uScale = 3;//Repeat 5 times on the Vertical Axes
          materialLI.diffuseTexture.vScale = 3;

          var polygon = BABYLON.Mesh.CreateRibbon("w-LI", [path1, path2], false, true, 20, scene, false, BABYLON.Mesh.BACKSIDE);
          polygon.material = materialLI;

        }
        else {
          var polygon = BABYLON.Mesh.CreateRibbon("w-LP", [path1, path2], false, false, 20, scene);
          polygon.material = mat;
        }

      }

      console.log(data.bbox);

      var onlyLayersPS = data.entities.filter(function (e) {
        return e.layer.substr(0, 2) === "PS" || e.layer.substr(0, 5) === "PG-CO" || e.layer.substr(0, 5) === "PG-TL" || e.layer.substr(0, 5) === "PG-LF"
      })
        
      //Loop each entity of data object  
      onlyLayersPS.forEach(function (entity) {
        if (entity.type === 'DIMENSION') {
          if (entity.block) {
            var block = data.blocks[entity.block];
            if (!block) {
              console.error('Missing block reference "' + entity.block + '"');
              //continue;
            }
            /*for(var j = 0; j < block.entities.length; j++) {
                drawEntity(block.entities[j], data);
            }*/
            //console.log(entity);
          } else {
            console.log('WARNING: No block for DIMENSION entity');
          }
        } else {
          //console.log(entity);
          drawEntity(entity, data);
        }
      });

      scene.registerBeforeRender(function () {
        pl.position = camera.position;
      });
      return scene;

    }

    var scene = createScene(data, engine);

    engine.runRenderLoop(function () {
      scene.render();
    });

    // Resize
    window.addEventListener("resize", function () {
      engine.resize();
    });

  }


})(BabylonDxf || (BabylonDxf = {}));