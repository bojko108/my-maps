// uGIS library
// website: http://ugis.pontech.bg/ugisdocs/docs
// version: 0.1.8

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.UGisApp = factory());
}(this, (function () { 'use strict';

ol.coordinate.dist2d = function (p1, p2) {
    let dx = p1[0] - p2[0];
    let dy = p1[1] - p2[1];
    return Math.sqrt(dx * dx + dy * dy);
};
ol.coordinate.equal = function (p1, p2) {
    return (p1[0] == p2[0] && p1[1] == p2[1]);
};
ol.geom.LineString.prototype.splitAt = function (pt, tol) {
    if (!pt) return [this];
    if (!tol) tol = 1e-10;
    if (pt.length && pt[0].length) {
        let result = [this];
        for (let i = 0; i < pt.length; i++) {
            let r = [];
            for (let k = 0; k < result.length; k++) {
                let ri = result[k].splitAt(pt[i]);
                r = r.concat(ri);
            }
            result = r;
        }
        return result;
    }
    if (ol.coordinate.equal(pt, this.getFirstCoordinate()) || ol.coordinate.equal(pt, this.getLastCoordinate())) {
        return [this];
    }
    let c0 = this.getCoordinates();
    let ci = [c0[0]], p0, p1;
    let c = [];
    for (let i = 0; i < c0.length - 1; i++) {
        if (ol.coordinate.equal(c0[i], c0[i + 1])) continue;
        if (ol.coordinate.equal(pt, c0[i + 1])) {
            ci.push(c0[i + 1]);
            c.push(new ol.geom.LineString(ci));
            ci = [];
        }
        else if (!ol.coordinate.equal(pt, c0[i])) {
            let d1, d2;
            if (c0[i][0] == c0[i + 1][0]) {
                d1 = d2 = (c0[i][1] - pt[1]) / (c0[i][1] - c0[i + 1][1]);
            }
            else if (c0[i][1] == c0[i + 1][1]) {
                d1 = d2 = (c0[i][0] - pt[0]) / (c0[i][0] - c0[i + 1][0]);
            }
            else {
                d1 = (c0[i][0] - pt[0]) / (c0[i][0] - c0[i + 1][0]);
                d2 = (c0[i][1] - pt[1]) / (c0[i][1] - c0[i + 1][1]);
            }
            if (Math.abs(d1 - d2) < tol && 0 <= d1 && d1 <= 1) {
                ci.push(pt);
                c.push(new ol.geom.LineString(ci));
                ci = [pt];
            }
        }
        ci.push(c0[i + 1]);
    }
    if (ci.length > 1) c.push(new ol.geom.LineString(ci));
    if (c.length) return c;
    else return [this];
};
var GeomUtils = function () {
    let
        sm_a = 6378137.0,
        sm_b = 6356752.314,
        sm_EccSquared = 6.69437999013e-03,
        UTMScaleFactor = 0.9996,
        pi = 3.14159265358979,
        wgs84Sphere = new ol.Sphere(sm_a);
    return {
        getGeodeticLength: (geom, source = 'EPSG:3857', target = 'EPSG:4326') => {
            let coords = geom.clone().getCoordinates(),
                length = 0.0;
            for (let i = 0, ii = coords.length - 1; i < ii; ++i) {
                let c1 = ol.proj.transform(coords[i], source, target),
                    c2 = ol.proj.transform(coords[i + 1], source, target);
                length += wgs84Sphere.haversineDistance(c1, c2);
            }
            return length;
        },
        getGeodeticArea: (geometry, source = 'EPSG:3857', target = 'EPSG:4326') => {
            let geom = geometry.clone().transform(source, target),
                coords = geom.getLinearRing(0).getCoordinates();
            return Math.abs(wgs84Sphere.geodesicArea(coords));
        },
    };
};

Number.prototype.toRad = function () { return this * (Math.PI / 180); };
Number.prototype.toDeg = function () { return this * (180 / Math.PI); };
Object.defineProperty(Object.prototype, 'toFeatureCollection', {
    value: function (input = 'EPSG:4326', output = 'EPSG:3857') {
        if (this.type && this.type === 'FeatureCollection') {
            let format = new ol.format.GeoJSON({ defaultDataProjection: input }),
                options = { dataProjection: input, featureProjection: output };
            return format.readFeatures(this, options);
        } else {
            console.error('Not a FeatureCollection!');
            return this;
        }
    }
});
ol.Feature.prototype.getLayerName = function () {
    let layer;
    let id = this.getId();
    if (!isNaN(parseFloat(id)) && isFinite(id)) {
    } else if (id) {
        let lastIndexOfPoint = id.lastIndexOf('.');
        layer = id.substring(0, lastIndexOfPoint);
    }
    return layer;
};
class Helpers {
    static urlParam(name) {
        var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
        if (results === null) {
            return null;
        } else {
            if (this.isNumeric(results[1])) {
                results[1] = Number(results[1]);
            }
            return results[1] || 0;
        }
    }
    static urlParams() {
        var match,
            pl = /\+/g,
            search = /([^&=]+)=?([^&]*)/g,
            decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
            query = window.location.search.substring(1),
            result = {};
        while ((match = search.exec(query)) !== null) {
            var param = decode(match[2]);
            if (this.isNumeric(param)) {
                param = Number(param);
            }
            result[decode(match[1])] = param;
        }
        return result;
    }
    static formatWithObject(mask, object, removeLeftovers) {
        for (let name in object) {
            let regEx = new RegExp("\\{" + name + "\\}", "gm");
            mask = mask.replace(regEx, object[name]);
        }
        removeLeftovers = (removeLeftovers !== undefined ? removeLeftovers : true);
        if (removeLeftovers) {
            let regex = new RegExp('{(.*?)}'),
                match;
            while ((match = regex.exec(mask)) !== null) {
                mask = mask.replace(regex, '');
            }
        }
        return mask;
    }
    static format(mask) {
        for (let i = 1; i < arguments.length; i++) {
            var regEx = new RegExp("\\{" + (i - 1) + "\\}", "gm");
            mask = mask.replace(regEx, arguments[i]);
        }
        return mask;
    }
    static isNumeric(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }
    static ALERT_TYPE() {
        return {
            INFO: {
                'color': '#FEF9F9',
                'background-color': '#5CB85C'
            },
            WARNING: {
                'color': '#F0AD4E',
                'background-color': 'red'
            },
            ERROR: {
                'color': '#FEF9F9',
                'background-color': '#D9534F'
            }
        };
    }
    static showAlert(message, delay, type) {
        var alert = $('<div />', {
            'text': message
        });
        delay = delay || 1000;
        type = type || this.ALERT_TYPE.INFO;
        alert.css({
            'position': 'absolute',
            'z-index': '1000000',
            'top': '40%',
            'left': '40%',
            'min-width': '300px',
            'min-height': '100px',
            'max-width': '50%',
            'text-align': 'center',
            'margin-top': 'auto',
            'margin-left': 'auto',
            'overflow': 'auto',
            '-moz-border-radius': '5px',
            'border-radius': '5px',
            'color': type.color,
            'background-color': type['background-color']
        });
        setTimeout(function () {
            alert.remove();
        }, delay);
        $('body').append(alert);
    }
}

class Resources {
    static get current() { return this._current; }
    static set current(language) { this._current = this[language]; }
    static get bg() {
        return {
            attachmentsTitle: 'Прикачени документи',
            attachmentsNewTitle: 'Прикачване на нов документ:',
            attachmentsNewValue: 'Изберете файл...',
            attachmentsOpenTooltip: 'избиране на нов документ',
            attachmentsRemoveTooltip: 'изтриване на документа',
            attachmentsUploadTooltip: 'изпращане на документа',
            attachmentsCloseButton: 'Затвори',
            attachmentsRemove: 'Искате ли да изтриете избраният файл?',
            bookmarksTitle: 'Съхранени изгледи',
            bookmarksCreated: 'Съхраненият изглед беше запазен успешно!',
            bookmarksError: 'Съхраненият изглед не беше запазен поради следната грешка: ',
            bookmarksName: 'Име на нов съхранен изглед',
            bookmarksCreateNew: 'Създаване на нов съхранен изглед',
            bookmarksDelete: 'Изтриване на съхранен изглед',
            bookmarksConfirmDelete: 'За да изтриете избраният съхранен изглед натиснете ОК.',
            bookmarksButtonCreate: 'Създай нов',
            bookmarksButtonLoad: 'Зареди',
            bookmarksButtonDelete: 'Изтрий',
            geocodingTitle: 'Гeокодиране',
            geocodingDirectOption: 'по адрес',
            geocodingReverceOption: 'по координати',
            geocodingSourceLabel: 'Източник:',
            geocodingAddressLabel: 'Адрес:',
            geocodingLatitudeLabel: 'Ширина:',
            geocodingLongitudeLabel: 'Дължина:',
            geocodingAddressPlaceholder: 'град, улица...',
            gotoxyTitle: 'GoTo XY',
            gotoxyGeographicOption: 'географски координати',
            gotoxyProjectedOption: 'проекционни (метри)',
            gotoxyLatitudeLabel: 'Ширина (X):',
            gotoxyLongitudeLabel: 'Дължина (Y):',
            traceTitle: 'Трасиране',
            traceUpstreamType: 'към източника',
            traceDownStreamType: 'от източника',
            traceButtonTitle: 'Трасирай',
            reportsTitle: 'Справки',
            reportsType: 'Вид справка:',
            reportsOption1: 'Брой тръби по цолаж',
            reportsOption2: 'Количество в източника',
            reportsOption3: 'Профил на терена',
            reportsButtonShow: 'Покажи',
            reportsButtonClose: 'Затвори',
            legendTitle: 'Легенда',
            measureTitle: 'Измерване',
            measureFeatureTitle: 'Измерване на обект',
            measureFeatureType: 'Тип:',
            measureFeaturePolygon: 'Площ:',
            measureFeatureLine: 'Дължина:',
            measureFeaturePointX: 'Географска ширина:',
            measureFeaturePointY: 'Географска дължина:',
            measureFeaturePointZ: 'Надморска височина:',
            measureFeatureExtent: 'Обхват:',
            measureFeatureCoords: 'Координати:',
            printControlLabel: 'Принтиране',
            profileTitle: 'Профил',
            profileError: 'Генериране на профил',
            editingStart: 'Започване на редакция',
            editingFinish: 'Приключване на редакция',
            editingFeature: 'Обект',
            editingButtonSave: 'Запази',
            editingButtonCancel: 'Отмени',
            editingEditsSaved: 'Редакциите бяха запазени успешно!',
            importSelectFile: 'Изберете файл...',
            importTitle: 'Добавяне на данни',
            importSelectLayer: 'Изберете целеви слой от списъка:',
            importNewLayer: 'име на нов слой',
            coordinateSystem: 'Координатна система',
            coordinateSystemUTM: 'UTM зона 35N',
            searchTitle: 'Търсене',
            searchSingle: 'Търсене...',
            searchByAttributesLabel: 'по атрибути',
            searchByLocationLabel: 'пространствено',
            searchDistanceLabel: 'Разстояние за търсене:',
            searchLayers: 'Изберете слой от списъка:',
            searchType: 'Изберете вид търсене:',
            selectZoomTo: 'Приближи към',
            selectPanTo: 'Премести към',
            selectFlash: 'Подчертай',
            userLocationActivate: 'Моята локация',
            userLocationZoomTo: 'Приближи',
            excError: 'Грешка',
            excNoSingleSearch: 'Бързото търсене не е дефинирано!',
            excNoAttributeSearch: 'Търсенето по атрибути не е дефинирано!',
            excNoSpatialSearch: 'Пространственото търсене не е дефинирано!',
            excNoSelection: 'Първо изберете обект!',
            optionYes: 'Да',
            optionNo: 'Не',
            delete: 'Изтриване',
            confirmDelete: 'Искате ли да изтриете селектираните обекти?'
        };
    }
    static get en() {
        return {
            attachmentsTitle: 'Attachments',
            attachmentsNewTitle: 'Attach a new document:',
            attachmentsNewValue: 'Choose file...',
            attachmentsOpenTooltip: 'attach new document',
            attachmentsRemoveTooltip: 'remove the document',
            attachmentsUploadTooltip: 'send the document',
            attachmentsCloseButton: 'Close',
            attachmentsRemove: 'Do you want to remove selected file?',
            bookmarksTitle: 'Bookmarks',
            bookmarksCreated: 'Bookmark was created successfully!',
            bookmarksError: 'Bookmark was not saved due to: ',
            bookmarksName: 'Bookmark name',
            bookmarksCreateNew: 'Create new bookmark',
            bookmarksDelete: 'Delete bookmark',
            bookmarksConfirmDelete: 'To delete selected bookmark click OK.',
            bookmarksButtonCreate: 'Create new',
            bookmarksButtonLoad: 'Load',
            bookmarksButtonDelete: 'Delete',
            geocodingTitle: 'Geocoding',
            geocodingDirectOption: 'by address',
            geocodingReverceOption: 'by coordinates',
            geocodingSourceLabel: 'Source:',
            geocodingAddressLabel: 'Address:',
            geocodingLatitudeLabel: 'Latitude:',
            geocodingLongitudeLabel: 'Longitude:',
            geocodingAddressPlaceholder: 'city, street...',
            gotoxyTitle: 'GoTo XY',
            gotoxyGeographicOption: 'geographic coordinates',
            gotoxyProjectedOption: 'projected (meters)',
            gotoxyLatitudeLabel: 'Latitude (X):',
            gotoxyLongitudeLabel: 'Longitude (Y):',
            traceTitle: 'Trace',
            traceUpstreamType: 'upstream',
            traceDownStreamType: 'downstream',
            traceButtonTitle: 'Trace',
            reportsTitle: 'Reports',
            reportsType: 'Type of report',
            reportsOption1: 'Pipe count by diameter',
            reportsOption2: 'Quantity at source',
            reportsOption3: 'Terrain profile',
            reportsButtonShow: 'Show',
            reportsButtonClose: 'Close',
            legendTitle: 'Legend',
            measureTitle: 'Measure',
            measureFeatureTitle: 'Measure feature',
            measureFeatureType: 'Geometry type:',
            measureFeaturePolygon: 'Area:',
            measureFeatureLine: 'Length:',
            measureFeaturePointX: 'Latitude:',
            measureFeaturePointY: 'Longitude:',
            measureFeaturePointZ: 'Elevation:',
            measureFeatureExtent: 'Extent:',
            measureFeatureCoords: 'Coordinates:',
            profileTitle: 'Profile',
            profileError: 'Generating profile',
            printControlLabel: 'Print',
            editingStart: 'Start editing',
            editingFinish: 'Finish Editing',
            editingFeature: 'Feature',
            editingButtonSave: 'Save',
            editingButtonCancel: 'Cancel',
            editingEditsSaved: 'Edits were saved successfully!',
            importSelectFile: 'Choose file...',
            importTitle: 'Import data',
            importSelectLayer: 'Select target layer from list:',
            importNewLayer: 'new layer name',
            coordinateSystem: 'Coordinate system:',
            coordinateSystemUTM: 'UTM 35N',
            searchTitle: 'Search',
            searchSingle: 'Search...',
            searchByAttributesLabel: 'by attributes',
            searchByLocationLabel: 'spatial',
            searchDistanceLabel: 'Distance:',
            searchLayers: 'Choose layer from list:',
            searchType: 'Choose type of search:',
            selectZoomTo: 'Zoom to',
            selectPanTo: 'Pan to',
            selectFlash: 'Highlight',
            userLocationActivate: 'My location',
            userLocationZoomTo: 'Go to',
            excError: 'Error',
            excNoSingleSearch: 'Single line search is not available!',
            excNoAttributeSearch: 'Attribute search is not available!',
            excNoSpatialSearch: 'Spatial search is not available!',
            excNoSelection: 'Select at least one object!',
            optionYes: 'Yes',
            optionNo: 'No',
            delete: 'Delete',
            confirmDelete: 'Do you want to delete selected features?'
        };
    }
}

class StylesClass {
    constructor(styleConfig, mapp, layerName) {
        this._defaultStyle = {
            name: 'default',
            fillColor: 'rgba(192,192,192,0.5)',
            strokeColor: '#808080',
            strokeWidth: 3,
            circle: {
                radius: 5,
                fillColor: '#1589FF',
                strokeColor: '#2B3856',
                strokeWidth: 2
            }
        };
        if (!styleConfig) {
            styleConfig = [this._defaultStyle];
        }
        this._mapp = mapp;
        this._configStyles = (styleConfig.drawingInfo ? this._fromEsriStyle(styleConfig.drawingInfo.renderer) : styleConfig);
        this._styles = {};
        this._layerName = layerName;
    }
    getStyleFor(feature, resolution, legend) {
        if (legend) return this._getLayerSymbology();
        let style = this._getStyle(feature);
        if (!this._styles[style.name]) {
            this._styles[style.name] = (style[0] instanceof ol.style.Style ? style[0] : this._createStyle(feature, resolution, style));
        }
        let label = this._createLabel(feature, resolution, style.text);
        this._styles[style.name].setText(label);
        return [this._styles[style.name]];
    }
    createStyle(data) {
        return this._createStyle({ get: '' }, 0, data);
    }
    _getStyle(feature) {
        let style;
        if (this._configStyles) {
            for (let i = 0; i < this._configStyles.length; i++) {
                let valid = false;
                for (let key in this._configStyles[i].fields) {
                    let value = this._configStyles[i].fields[key];
                    if (typeof value === 'string' && value.indexOf('$in') > -1) {
                        let values = value.replace('$in', '').replace('(', '').replace(')', '').split(',');
                        for (let i = 0; i < values; i++) {
                            valid = (feature.get(key) == values[i] ? true : false);
                            if (valid === true) break;
                        }
                    } else {
                        valid = (feature.get(key) === value ? true : false);
                    }
                }
                if (valid) {
                    style = this._configStyles[i];
                    break;
                }
            }
            return style || this._configStyles[this._configStyles.length - 1];
        } else {
            return ol.style.Style.defaultFunction(null, null);
        }
    }
    _createStyle(feature, resolution, style) {
        style = style || this._defaultStyle;
        let
            stroke = new ol.style.Stroke({
                color: (style.strokeColor && style.strokeColor.includes("$.")) ? feature.get(style.strokeColor.replace("$.", "")) : style.strokeColor,
                width: (style.strokeWidth && isNaN(style.strokeWidth) && style.strokeWidth.includes("$.")) ? feature.get(style.strokeWidth.replace("$.", "")) : style.strokeWidth,
                lineDash: style.lineDash
            }),
            fill = new ol.style.Fill({ color: (style.fillColor && style.fillColor.includes("$.")) ? feature.get(style.fillColor.replace("$.", "")) : style.fillColor }),
            image;
        if (style.icon) {
            let src = style.icon.src.includes("$.") ? feature.get(style.icon.src.replace("$.", "")) : style.icon.src;
            src = (style.icon.type ? style.icon.type + src : src);
            image = new ol.style.Icon({
                rotation: (Number(style.icon.rotation) || 0.0).toRad(),
                anchor: style.icon.anchor || [0.5, 0.5],
                anchorXUnits: style.icon.anchorXUnits || 'fraction',
                anchorYUnits: style.icon.anchorYUnits || 'fraction',
                opacity: style.icon.opacity || 1,
                size: style.icon.size,
                scale: style.icon.scale,
                src: src
            });
        }
        if (style.circle) {
            image = new ol.style.Circle({
                radius: style.circle.radius,
                fill: new ol.style.Fill({ color: style.circle.fillColor.includes("$.") ? feature.get(style.circle.fillColor.replace("$.", "")) : style.circle.fillColor }),
                stroke: new ol.style.Stroke({
                    color: style.circle.strokeColor.includes("$.") ? feature.get(style.circle.strokeColor.replace("$.", "")) : style.circle.strokeColor,
                    width: (isNaN(style.circle.strokeWidth) && style.circle.strokeWidth.includes("$.")) ? feature.get(style.circle.strokeWidth.replace("$.", "")) : style.circle.strokeWidth,
                    lineDash: style.circle.lineDash
                })
            });
        }
        return new ol.style.Style({
            stroke: stroke,
            fill: fill,
            image: image
        });
    }
    _createLabel(feature, resolution, text) {
        if (!text) return null;
        let label = null,
            mask = text.labelMask,
            maxResolution = this._mapp.getMapResolutionFromScale(text.maxScale || 1000);
        if (maxResolution >= resolution) {
            label = new ol.style.Text({
                font: text.font,
                text: Helpers.formatWithObject(mask, feature.getProperties()),
                offsetX: text.offsetX,
                offsetY: text.offsetY,
                textAlign: text.textAlign,
                textBaseline: text.textBaseline,
                fill: new ol.style.Fill({ color: (text.fillColor && text.fillColor.includes("$.")) ? feature.get(text.fillColor.replace("$.", "")) : text.fillColor }),
                stroke: new ol.style.Stroke({
                    color: (text.strokeColor && text.strokeColor.includes("$.")) ? feature.get(text.strokeColor.replace("$.", "")) : text.strokeColor,
                    width: (text.strokeWidth && isNaN(text.strokeWidth) && text.strokeWidth.includes("$.")) ? feature.get(text.strokeWidth.replace("$.", "")) : text.strokeWidth,
                    lineDash: text.lineDash
                })
            });
        }
        return label;
    }
    _fromEsriStyle(data) {
        let style = [];
        if (data.defaultSymbol) {
            style.push({
                name: 'default',
                icon: {
                    src: 'data:image/png;base64,' + data.defaultSymbol.imageData
                }
            });
        }
        data.uniqueValueInfos.forEach(value => {
            let info = {
                name: value.label,
                fields: {},
                icon: {
                    src: 'data:image/png;base64,' + value.symbol.imageData
                }
            };
            if (data.field1) info.fields[data.field1] = (value.values ? `$in(${value.values.join()})` : value.value);
            style.push(info);
        });
        return style;
    }
    _getLayerSymbology() {
        let element = document.createElement('div');
        if (this._configStyles && this._configStyles.length > 0) {
            this._configStyles.forEach(style => {
                if (style.strokeColor && style.strokeWidth && style.fillColor) {
                    element.appendChild(this._createPolygonElement(style.strokeColor, style.strokeWidth, style.fillColor, style.name));
                }
                if (style.strokeColor && style.strokeWidth && !style.fillColor) {
                    element.appendChild(this._createLineElement(style.strokeColor, style.strokeWidth, style.name));
                }
                if (style.icon) {
                    element.appendChild(this._createImgElement(style.icon.src, style.name));
                }
                if (style.circle) {
                    element.appendChild(this._createPointElement(style.circle.radius, style.circle.strokeColor, style.circle.strokeWidth, style.circle.fillColor, style.name));
                }
                let br = document.createElement('br');
                element.appendChild(br);
            });
        } else {
            let layer = this._mapp.getLayerBy(this._layerName);
            if (!layer) return element;
            let layerStyle = layer.getStyle();
            if (!(layerStyle instanceof ol.style.Style))
                layerStyle = ol.style.Style.defaultFunction(null, null)[0];
            if (layerStyle.getStroke() && layerStyle.getFill()) {
                element.appendChild(this._createPolygonElement(layerStyle.getStroke().getColor(), layerStyle.getStroke().getWidth(), layerStyle.getFill().getColor()));
            }
            if (layerStyle.getStroke() && !layerStyle.getFill()) {
                element.appendChild(this._createLineElement(layerStyle.getStroke().getColor(), layerStyle.getStroke().getWidth()));
            }
            if (layerStyle.getImage()) {
                if (!layerStyle.getImage().getRadius) {
                    element.appendChild(this._createImgElement(layerStyle.getImage().getSrc()));
                }
                if (layerStyle.getImage().getRadius) {
                    element.appendChild(this._createPointElement(layerStyle.getImage().getRadius(), layerStyle.getImage().getStroke().getColor(), layerStyle.getImage().getStroke().getWidth(), layerStyle.getImage().getFill().getColor()));
                }
            }
        }
        let br = document.createElement('br');
        element.appendChild(br);
        return element;
    }
    _createImgElement(imgSrc, name) {
        let row = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        row.setAttribute('width', '100%');
        row.setAttribute('height', 30);
        let image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', imgSrc);
        image.setAttribute('x', 20);
        image.setAttribute('y', 5);
        image.setAttribute('width', 20);
        image.setAttribute('height', 20);
        let text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', 60);
        text.setAttribute('y', 20);
        text.setAttribute('font-size', 15);
        text.textContent = name;
        row.appendChild(image);
        row.appendChild(text);
        return row;
    }
    _createPointElement(radius, stroke, width, fill, name) {
        let row = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        row.setAttribute('width', '100%');
        row.setAttribute('height', 30);
        let circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', 30);
        circle.setAttribute('cy', 15);
        circle.setAttribute('r', radius);
        circle.setAttribute('stroke', stroke);
        circle.setAttribute('stroke-width', width);
        circle.setAttribute('fill', fill);
        let text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', 60);
        text.setAttribute('y', 20);
        text.setAttribute('font-size', 15);
        text.textContent = name;
        row.appendChild(circle);
        row.appendChild(text);
        return row;
    }
    _createLineElement(stroke, width, name) {
        let row = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        row.setAttribute('width', '100%');
        row.setAttribute('height', 30);
        let line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', 10);
        line.setAttribute('y1', 15);
        line.setAttribute('x2', 50);
        line.setAttribute('y2', 15);
        line.setAttribute('stroke', stroke);
        line.setAttribute('stroke-width', width);
        let text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', 60);
        text.setAttribute('y', 20);
        text.setAttribute('font-size', 15);
        text.textContent = name;
        row.appendChild(line);
        row.appendChild(text);
        return row;
    }
    _createPolygonElement(stroke, width, fill, name) {
        let row = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        row.setAttribute('width', '100%');
        row.setAttribute('height', 30);
        let polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', '10,10 50,10 50,20 10,20');
        polygon.setAttribute('style', `fill: ${fill}; stroke: ${stroke}; stroke-width: ${width};`);
        let text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', 60);
        text.setAttribute('y', 20);
        text.setAttribute('font-size', 15);
        text.textContent = name;
        row.appendChild(polygon);
        row.appendChild(text);
        return row;
    }
}

class MaskClass {
    constructor(config, layer) {
        this._inner = (config.inner !== undefined) ? config.inner : false;
        this._fillColor = config.fill || 'rgba(0,0,0,0.2)';
        this._feature = null;
        if (config.feature) {
            switch (config.feature.getGeometry().getType()) {
                case "Polygon":
                case "MultiPolygon":
                    this._feature = config.feature;
                    break;
                default: break;
            }
        }
        this._addFilter(layer);
    }
    _addFilter(layer) {
        layer.on('postcompose', (e) => { this._postcompose(e); });
    }
    _drawFeaturePath(e, out) {
        var ctx = e.context;
        var canvas = ctx.canvas;
        var ratio = e.frameState.pixelRatio;
        var m = e.frameState.coordinateToPixelTransform;
        function tr(pt) {
            return [
                (pt[0] * m[0] + pt[1] * m[1] + m[4]) * ratio,
                (pt[0] * m[2] + pt[1] * m[3] + m[5]) * ratio
            ];
        }
        if (!m) {
            m = e.frameState.coordinateToPixelMatrix;
            tr = function (pt) {
                return [
                    (pt[0] * m[0] + pt[1] * m[1] + m[12]) * ratio,
                    (pt[0] * m[4] + pt[1] * m[5] + m[13]) * ratio
                ];
            };
        }
        var ll = this._feature.getGeometry().getCoordinates();
        if (this._feature.getGeometry().getType() == "Polygon") ll = [ll];
        ctx.beginPath();
        if (out) {
            ctx.moveTo(0, 0);
            ctx.lineTo(canvas.width, 0);
            ctx.lineTo(canvas.width, canvas.height);
            ctx.lineTo(0, canvas.height);
            ctx.lineTo(0, 0);
        }
        for (var l = 0; l < ll.length; l++) {
            var c = ll[l];
            for (var i = 0; i < c.length; i++) {
                var pt = tr(c[i][0]);
                ctx.moveTo(pt[0], pt[1]);
                for (var j = 1; j < c[i].length; j++) {
                    pt = tr(c[i][j]);
                    ctx.lineTo(pt[0], pt[1]);
                }
            }
        }
    }
    _postcompose(e) {
        if (!this._feature) return;
        var ctx = e.context;
        ctx.save();
        this._drawFeaturePath(e, !this._inner);
        ctx.fillStyle = this._fillColor;
        ctx.fill("evenodd");
        ctx.restore();
    }
}

class MappClass {
    constructor(config, target) {
        config.map.controls = config.map.controls || {};
        this._getFeaturesBBOX = config.map.getFeaturesBBOX || '';
        this._getFeaturesList = config.map.getFeaturesList || '';
        this._metadataUrl = config.map.metadataUrl;
        this._maxextent = config.map.view.maxExtent;
        this._clickedLocation = null;
        this._flashOnClick = config.map.flashOnClick;
        this._map = new ol.Map({
            target: target || 'mapp',
            view: new ol.View({
                center: ol.proj.transform([config.map.view.longitude, config.map.view.latitude], 'EPSG:4326', 'EPSG:3857'),
                zoom: config.map.view.zoomLevel,
                minZoom: config.map.view.minZoom || 0,
                maxZoom: config.map.view.maxZoom || 28,
                extent: (this._maxextent ? ol.proj.transformExtent(this._maxextent, 'EPSG:4326', 'EPSG:3857') : this._maxextent)
            }),
            controls: ol.control.defaults({ rotate: config.map.controls.rotate }),
            interactions: ol.interaction.defaults({ altShiftDragRotate: config.map.controls.altShiftDragRotate, pinchRotate: config.map.controls.pinchRotate })
        });
        if (config.layers && config.layers.basemaps) {
            this.addBasemaps(config.layers.basemaps.slice().reverse());
        }
        if (config.layers && config.layers.operational) {
            this.addOperationalLayers(config.layers.operational.slice().reverse());
        }
        this._markers = this.createOperationalLayer({
            name: 'markers',
            zIndex: 1001,
            type: 'operational',
            empty: true,
            showInLegend: false,
            geometry: 'Point',
            visible: true,
            source: new ol.source.Vector({
                features: new ol.Collection()
            })
        });
        this._map.addLayer(this._markers);
        this._map.on('singleclick', e => { this._ponterClick(e); });
        this._map.on('pointermove', e => { this._pointerMove(e); });
    }
    get defaultLayer() { return this._markers; }
    get map() { return this._map; }
    get projection() { return this._map.getView().getProjection().getCode(); }
    get basemaps() { return this.getBasemapLayers(); }
    get layers() { return this.getOperationalLayers(); }
    get center() { return this._map.getView().getCenter(); }
    set center(value) { this._map.getView().animate({ center: value, duration: 250 }); }
    get zoom() { return this._map.getView().getZoom(); }
    set zoom(value) { return this._map.getView().animate({ zoom: value, duration: 250 }); }
    get rotation() { return this._map.getView().getRotation().toDeg(); }
    set rotation(value) { return this._map.getView().animate({ rotation: value.toRad(), duration: 250 }); }
    get clickedLocation() {
        return this._clickedLocation;
    }
    positionAt(value) { this._map.getView().animate(value); }
    addLayersFromConfig(config) {
        if (config.basemaps) {
            this.addBasemaps(config.basemaps.slice().reverse());
        }
        if (config.operational) {
            this.addOperationalLayers(config.operational.slice().reverse());
        }
    }
    getBasemapLayers() {
        let layers = this._map.getLayers().getArray().slice().reverse(),
            result = [];
        for (let i = 0, l; i < layers.length; i++) {
            l = layers[i];
            if (l.get('title') && l.get('showInLegend') && l.get('type') === 'base') {
                result.push(l);
            }
        }
        return result;
    }
    getOperationalLayers() {
        let layers = this._map.getLayers().getArray().slice().reverse(),
            result = [];
        for (let i = 0, l; i < layers.length; i++) {
            l = layers[i];
            if (l.get('title') && l.get('showInLegend') && l.get('type') !== 'base') {
                result.push(l);
            }
        }
        return result;
    }
    addBasemaps(basemaps) {
        if (Array.isArray(basemaps)) {
            basemaps.forEach(b => {
                this._map.addLayer(this.createBasemapLayer(b));
            });
        }
    }
    createBasemapLayer(data) {
        let source = this.getPredefinedTileLayer(data);
        if (source) {
            let layer = new ol.layer.Tile({
                name: data.name,
                title: data.title || 'Basemap layer',
                showInLegend: (data.showInLegend !== undefined) ? data.showInLegend : true,
                disabledInLegend: (data.disabledInLegend !== undefined) ? data.disabledInLegend : false,
                icon: data.icon || '',
                type: data.type || 'base',
                zIndex: data.zIndex || 0,
                visible: (data.visible !== undefined) ? data.visible : true,
                minResolution: this.getMapResolutionFromScale(data.minScale || 1),
                maxResolution: this.getMapResolutionFromScale(data.maxScale || 100000000),
                source: source,
                opacity: data.opacity || 1,
                orderIndex: data.orderIndex || 0
            });
            if (data.mask) this._createMaskFor(layer, data.mask);
            return layer;
        }
    }
    getPredefinedTileLayer(data) {
        switch (data.name) {
            case 'osm':
                return new ol.source.OSM();
            case 'local':
                return new ol.source.XYZ({
                    url: data.url
                });
            case 'ocm':
                return new ol.source.XYZ({
                    url: 'https://a.tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey=a5ce9ce48b7d48238f1c691c4161f29c'
                });
            case 'stamen_watercolor':
                return new ol.source.Stamen({
                    layer: 'watercolor'
                });
            case 'bing_road':
                return new ol.source.BingMaps({
                    key: 'AkGbxXx6tDWf1swIhPJyoAVp06H0s0gDTYslNWWHZ6RoPqMpB9ld5FY1WutX8UoF',
                    imagerySet: 'Road'
                });
            case 'bing_aerial':
                return new ol.source.BingMaps({
                    key: 'AkGbxXx6tDWf1swIhPJyoAVp06H0s0gDTYslNWWHZ6RoPqMpB9ld5FY1WutX8UoF',
                    imagerySet: 'Aerial'
                });
            case 'mapbox_aerial':
                return new ol.source.XYZ({
                    url: 'https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYm9qa28xMDgiLCJhIjoiY2l2ajc5NXpmMDA1NzJ0cHAzNjllZW9rcSJ9.3zzjbfbOdfhaXqLHZYkcNQ'
                });
            case 'bgtopo_126k':
                return new ol.source.TileWMS(                                        ({
                    attributions: [
                        new ol.Attribution({
                            html: '<a href="http://cart.uni-plovdiv.net/" target="_blank">CART Lab</a>' +
                            ' / ' +
                            '<a href="https://plus.google.com/117738982997877636232?rel=author" target="_blank">Vedrin Jeliazkov</a>'
                        })
                    ],
                    url: 'http://www.kade.si/cgi-bin/mapserv?',
                    params: { 'LAYERS': 'BGtopo-126k', 'TILED': true, 'format': 'image/png' }
                }));
            case 'bgtopo_25k':
                return new ol.source.TileWMS(                                        ({
                    attributions: [
                        new ol.Attribution({
                            html: '<a href="http://cart.uni-plovdiv.net/" target="_blank">CART Lab</a>' +
                            ' / ' +
                            '<a href="https://plus.google.com/117738982997877636232?rel=author" target="_blank">Vedrin Jeliazkov</a>'
                        })
                    ],
                    url: 'http://www.kade.si/cgi-bin/mapserv?',
                    params: { 'LAYERS': 'BGtopoVJ-raster-v3.00', 'TILED': true, 'format': 'image/png' }
                }));
            case 'bgmountains':
                return new ol.source.OSM({
                    attributions: [
                        new ol.Attribution({
                            html: '<a href="http://cart.uni-plovdiv.net/" target="_blank">CART Lab</a>' +
                            ' / ' +
                            '<a href="http://www.bgmountains.org/" target="_blank">BGM team</a>'
                        })
                    ],
                    url: 'http://bgmtile.kade.si/{z}/{x}/{y}.png'
                });
            case 'topo':
                return new ol.source.XYZ({
                    url: 'https://b.tile.opentopomap.org/{z}/{x}/{y}.png'
                });
            default:
                return null;
        }
    }
    _createMaskFor(layer, data) {
        this.getFeature(data.fid)
            .then(feature => {
                let mask = new MaskClass({
                    inner: (data.inner !== undefined ? data.inner : false),
                    feature: feature,
                    fill: data.fill || 'rgba(0,0,0,0.2)'
                }, layer);
            });
    }
    addOperationalLayers(layers) {
        if (Array.isArray(layers)) {
            layers.forEach(l => this._map.addLayer(this.createCustomLayer(l)));
        }
    }
    createCustomLayer(layer) {
        if (layer.type === 'group') {
            return this.createGroupLayer(layer);
        }
        if (layer.type === 'operational') {
            return this.createOperationalLayer(layer);
        }
    }
    createGroupLayer(data) {
        let childLayers = [],
            layers = data.layers.slice().reverse();
        for (let i = 0; i < layers.length; i++) {
            let layer;
            if (layers[i].type === 'operational') {
                layer = this.createOperationalLayer(layers[i]);
                if (layer) {
                    childLayers.push(layer);
                }
            }
        }
        return new ol.layer.Group({
            name: data.name,
            title: data.title,
            showInLegend: (data.showInLegend !== undefined) ? data.showInLegend : true,
            disabledInLegend: (data.disabledInLegend !== undefined) ? data.disabledInLegend : false,
            icon: data.icon,
            type: data.type,
            visible: (data.visible !== undefined) ? data.visible : true,
            layers: childLayers
        });
    }
    createOperationalLayer(data) {
        if (this._metadataUrl) {
            fetch(this._metadataUrl + data.name, {
                method: 'GET',
                headers: new Headers({
                    'Content-Type': 'application/json'
                })
            })
                .then(response => {
                    return response.json();
                })
                .then(response => {
                    let layer = this.getLayerBy(response.layer);
                    if (layer) {
                        layer.set('fieldsInfo', response);
                    }
                })
                .catch(error => {
                    console.error(error);
                });
        }
        if (data.empty) {
            data.source = new ol.source.Vector();
        }
        if (data.query) {
            data.source = new ol.source.Vector({
                loader: (extent, resolution, projection) => {
                    extent = ol.proj.transformExtent(extent, projection.getCode(), ol.proj.get(data.srcEPSG || 'EPSG:4326').getCode());
                    let query = {
                        layer: data.query.table,
                        bbox: extent,
                        query: data.query
                    };
                    fetch(this._getFeaturesBBOX, {
                        method: 'POST',
                        body: JSON.stringify(query),
                        headers: new Headers({
                            'Content-Type': 'application/json'
                        })
                    })
                        .then(response => {
                            if (!response.ok) throw Error(response.statusText);
                            else return response;
                        })
                        .then(response => {
                            return response.json();
                        })
                        .then(response => {
                            let format = new ol.format.GeoJSON({
                                defaultDataProjection: data.srcEPSG || 'EPSG:4326'
                            }),
                                source = this.getLayerBy(data.name).getSource();
                            let options = { dataProjection: data.srcEPSG, featureProjection: this.projection };
                            source.addFeatures(format.readFeatures(response, options));
                        })
                        .catch(error => {
                            console.log(error);
                        });
                },
                strategy: ol.loadingstrategy.bbox,
                projection: 'EPSG:3857'
            });
        }
        let style = new StylesClass(data.styles, this, data.name),
            layer = new ol.layer.Vector({
                name: data.name,
                title: data.title || 'Operational layer',
                icon: data.icon || '',
                type: data.type || 'operational',
                zIndex: data.zIndex || 0,
                showInLegend: (data.showInLegend !== undefined) ? data.showInLegend : true,
                disabledInLegend: (data.disabledInLegend !== undefined) ? data.disabledInLegend : false,
                fieldsInfo: false,
                editable: (data.editable !== undefined) ? data.editable : false,
                selectable: (data.selectable !== undefined) ? data.selectable : true,
                searchable: (data.searchable !== undefined) ? data.searchable : false,
                geometry: data.geometry,
                visible: (data.visible !== undefined) ? data.visible : true,
                minResolution: this.getMapResolutionFromScale(data.minScale || 1),
                maxResolution: this.getMapResolutionFromScale(data.maxScale || 10000000),
                style: (feature, resolution, legend) => { return style.getStyleFor(feature, resolution, legend); },
                opacity: data.opacity || 1,
                EPSG: data.srcEPSG,
                displayMask: data.displayMask,
                excludedFields: data.excludedFields || ',',
                source: data.source || new ol.source.Vector({
                    loader: (extent, resolution, projection) => {
                        extent = ol.proj.transformExtent(extent, projection.getCode(), ol.proj.get(data.srcEPSG || 'EPSG:4326').getCode());
                        let url = this.getUrl(data.name, extent);
                        fetch(url, {
                            method: 'GET',
                            headers: new Headers({
                                'Content-Type': 'application/json'
                            })
                        })
                            .then(response => {
                                if (!response.ok) throw Error(response.statusText);
                                else return response;
                            })
                            .then(response => {
                                return response.json();
                            })
                            .then(response => {
                                let format = new ol.format.GeoJSON({
                                    defaultDataProjection: data.srcEPSG || 'EPSG:4326'
                                }),
                                    source = this.getLayerBy(data.name).getSource();
                                let options = { dataProjection: data.srcEPSG, featureProjection: this.projection };
                                source.addFeatures(format.readFeatures(response, options));
                            })
                            .catch(error => {
                                console.error(error);
                            });
                    },
                    strategy: ol.loadingstrategy.bbox,
                    projection: 'EPSG:3857'
                })
            });
        return layer;
    }
    setFeatureServices(bbox, listFeatures) {
        this._getFeaturesBBOX = bbox;
        this._getFeaturesList = listFeatures;
    }
    getUrl(layerName, extent) {
        return this._getFeaturesBBOX + layerName + '/' + extent.join(',');
    }
    getFeature(fid) {
        let
            ftrId = this.getLayerNameAndFID(fid),
            url = this._getFeaturesList + ftrId[0] + '/' + ftrId[1];
        return new Promise((res, rej) => {
            fetch(url, {
                method: 'GET',
                headers: new Headers({
                    'Content-Type': 'application/json'
                })
            })
                .then(data => {
                    if (!data.ok) throw Error(data.statusText);
                    else return data;
                })
                .then(data => {
                    return data.json();
                })
                .then(data => {
                    let format = new ol.format.GeoJSON({ defaultDataProjection: 'EPSG:4326' }),
                        features = format.readFeatures(data, { featureProjection: this.projection });
                    return features[0];
                })
                .then(data => {
                    res(data);
                })
                .catch(error => {
                    rej(error);
                });
        });
    }
    getFeatures(url, resultFormat, outputProjection, headers) {
        return new Promise((res, rej) => {
            fetch(url, {
                method: 'GET',
                headers: headers || new Headers({
                    'Content-Type': 'application/json'
                })
            })
                .then(data => {
                    if (!data.ok) throw Error(data.statusText);
                    else return data;
                })
                .then(data => {
                    return data.json();
                })
                .then(data => {
                    let format = resultFormat || new ol.format.GeoJSON({ defaultDataProjection: 'EPSG:4326' }),
                        features = format.readFeatures(data, { featureProjection: outputProjection || this.projection });
                    return features;
                })
                .then(data => {
                    res(data);
                })
                .catch(error => {
                    rej(error);
                });
        });
    }
    deleteFeature(feature, layer) {
        if (!layer) {
            layer = feature.getLayer();
        } else {
            layer = this.getLayerBy(layer);
        }
        if (layer) {
            var source = layer.getSource();
            source.removeFeature(feature);
        }
    }
    addFeaturesFromGeoJSON(features) {
        var layer = this.getLayerBy(features.layer);
        if (layer) {
            var source = layer.getSource(),
                format = new ol.format.GeoJSON({
                    defaultDataProjection: layer.get('EPSG')
                });
            features = format.readFeatures(features, { dataProjection: layer.get('EPSG'), featureProjection: this.projection });
            source.addFeatures(features);
        }
        return features;
    }
    getTableForLayer(layer) {
        var ftr = layer.getSource().getFeatures()[0];
        return ftr.getProperties();
    }
    getLayerForFeature(fid) {
        return this.getLayerBy(this.getLayerNameAndFID(fid)[0]);
    }
    getLayerBy(value, parameter = 'name') {
        return this.getLayersBy(value, parameter)[0];
    }
    getLayersBy(value, parameter = 'name') {
        let layers = this._map.getLayers().getArray(),
            result = [];
        for (let i = 0; i < layers.length; i++) {
            if (layers[i].get(parameter) === value) {
                result.push(layers[i]);
            }
            if (layers[i].get('type') === 'group') {
                for (var k = 0; k < layers[i].getLayers().getArray().length; k++) {
                    if (layers[i].getLayers().getArray()[k].get(parameter) === value) {
                        result.push(layers[i].getLayers().getArray()[k]);
                    }
                }
            }
        }
        return result;
    }
    isLayerVisible(layer) {
        var resolution = this.getCurrentMapResolution(),
            max = layer.get('maxResolution') || 50000,
            min = layer.get('minResolution') || 0;
        if (resolution >= min && resolution <= max) {
            return layer.getVisible();
        } else {
            return false;
        }
    }
    getFeatureById(fid) {
        var source,
            layer = this.getLayerBy(this.getLayerNameAndFID(fid)[0]);
        if (layer) {
            source = layer.getSource();
            return source.getFeatureById(fid);
        }
    }
    getLayerNameAndFID(data) {
        var layer, id;
        if (!isNaN(parseFloat(data)) && isFinite(data)) {
            id = data;
        } else if (data) {
            var lastIndexOfPoint = data.lastIndexOf('.');
            layer = data.substring(0, lastIndexOfPoint);
            id = Number(data.substring(lastIndexOfPoint + 1, (data.length)));
        }
        return [layer, id];
    }
    getFeatureBy(parameter, value) {
        var layer = this.getFeaturesBy(parameter, value)[0];
        return layer;
    }
    getFeaturesBy(parameter, value) {
        var layers = jQuery.grep(map.getLayers().getArray(), function (layer) {
            return layer.get(parameter) === value;
        });
        return layers;
    }
    getCurrentMapExtent(destination = 'EPSG:4326') {
        let extent = ol.proj.transformExtent(this._map.getView().calculateExtent(this._map.getSize()), this._map.getView().getProjection().getCode(), destination);
        return extent;
    }
    calculateMapExtent(destination = 'EPSG:4326') {
        let extent = this.getCurrentMapExtent(destination);
        var name = prompt('Enter picture name:');
        if (name) {
            let result = '<map name="' + name + '.png" north="' + extent[3] + '" east="' + extent[2] + '" south="' + extent[1] + '" west="' + extent[0] + '"/>';
            prompt('Don\'t forget to make a printscreen of the map :)', result);
        }
    }
    setMapScale(scale) {
        let resolution = this.getMapResolutionFromScale(scale);
        this._map.getView().setResolution(resolution);
    }
    getMapScale(round) {
        let view = this._map.getView(),
            resolution = view.getResolution();
        return this.getMapScaleFromResolution(resolution, round);
    }
    getCurrentMapResolution() {
        let view = this._map.getView();
        return view.getResolution();
    }
    getMapScaleFromResolution(resolution, round) {
        let
            view = this._map.getView(),
            mpu = ol.proj.METERS_PER_UNIT[view.getProjection().getUnits()],
            result = resolution * mpu * 39.37 * (25.4 / 0.28);
        if (round === true) {
            return Math.round(result);
        } else {
            return result;
        }
    }
    getMapResolutionFromScale(scale) {
        var view = this._map.getView(),
            mpu = ol.proj.METERS_PER_UNIT[view.getProjection().getUnits()];
        return scale / (mpu * 39.37 * (25.4 / 0.28));
    }
    zoomTo(extent, zoomLevel = 15) {
        if (extent[2] <= extent[0] || extent[3] <= extent[1]) {
            this.center = [extent[0], extent[1]];
            this.zoom = zoomLevel;
        } else {
            this._map.getView().fit(extent);
        }
    }
    zoomToFID(fid, zoomLevel = 15) {
        var extent = new ol.extent.createEmpty();
        if (Array.isArray(fid)) {
            for (var i = 0; i < fid.length; i++) {
                var ftr = this.getFeatureById(fid[i]);
                if (ftr) {
                    extent = ol.extent.extend(extent, ftr.getGeometry().getExtent());
                }
            }
        } else {
            var f = this.getFeatureById(fid);
            if (f) {
                extent = f.getGeometry().getExtent();
            }
        }
        if (!ol.extent.isEmpty(extent)) {
            this.zoomTo(extent, zoomLevel);
        }
    }
    panTo(extent) {
        this.center = this.calculateCenterPointOfExtent(extent);
    }
    panToFID(fid) {
        var ftr = this.getFeatureById(fid);
        if (ftr) {
            this.panTo(ftr.getGeometry().getExtent());
        }
    }
    flash(geometry, renderMap = true, miliseconds = 1000, red = 255, green = 0, blue = 0) {
        let start = new Date().getTime(),
            listenerKey,
            duration = miliseconds;
        function animate(event) {
            var vectorContext = event.vectorContext,
                frameState = event.frameState,
                flashGeom = geometry.clone(),
                elapsed = frameState.time - start,
                elapsedRatio = elapsed / duration,
                radius = ol.easing.easeOut(elapsedRatio) * 5 + 5,
                opacity = ol.easing.easeOut(1 - elapsedRatio),
                style = new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: 'rgba(' + red + ', ' + green + ', ' + blue + ', ' + opacity + ')',
                        width: ol.easing.easeOut(elapsedRatio) * 10
                    }),
                    fill: new ol.style.Fill({
                        color: 'rgba(' + red + ', ' + green + ', ' + blue + ', ' + opacity + ')',
                    }),
                    image: new ol.style.Circle({
                        radius: radius,
                        snapToPixel: false,
                        stroke: new ol.style.Stroke({
                            color: 'rgba(' + red + ', ' + green + ', ' + blue + ', ' + opacity + ')',
                            width: ol.easing.easeOut(elapsedRatio) * 10
                        })
                    })
                });
            vectorContext.setStyle(style);
            vectorContext.drawGeometry(flashGeom);
            if (elapsed > duration) {
                ol.Observable.unByKey(listenerKey);
                return;
            }
            this.render();
        }
        listenerKey = this._map.on('postcompose', animate);
        if (renderMap === true) {
            this._map.render();
        }
    }
    flashFID(fid, renderMap = true, miliseconds = 1000, red = 255, green = 0, blue = 0) {
        var feature = this.getFeatureById(fid);
        if (feature) {
            this.flash(feature.getGeometry(), renderMap, miliseconds, red, green, blue);
        }
    }
    calculateCenterPointOfExtent(extent) {
        return [(extent[2] + extent[0]) / 2, (extent[3] + extent[1]) / 2];
    }
    createStyle(data, layerName) {
        data = data || [{
            name: 'default',
            fillColor: 'rgba(192,192,192,0.5)',
            strokeColor: '#808080',
            strokeWidth: 3,
            circle: {
                radius: 5,
                fillColor: '#1589FF',
                strokeColor: '#2B3856',
                strokeWidth: 2
            }
        }];
        data = (Array.isArray(data) ? data : [data]);
        data[0].name = (data[0].name ? data[0].name : 'default');
        let style = new StylesClass(data, this, layerName);
        return function (feature, resolution, legend) {
            if (this instanceof ol.Feature) {
                resolution = feature;
                feature = this;
            }
            return style.getStyleFor(feature, resolution, legend);
        };
    }
    getStyle(data) {
        console.error('Deprecated method, use StylesClass instead!');
        let component = this;
        data = data || {
            fillColor: 'rgba(192,192,192,0.5)',
            strokeColor: '#808080',
            strokeWidth: 3,
            circle: {
                radius: 5,
                fillColor: '#1589FF',
                strokeColor: '#2B3856',
                strokeWidth: 2
            }
        };
        let stroke = new ol.style.Stroke({ color: data.strokeColor, width: data.strokeWidth, lineDash: data.lineDash }),
            fill = new ol.style.Fill({ color: data.fillColor }),
            image;
        if (data.icon) {
            image = new ol.style.Icon({
                rotation: (Number(data.icon.rotation) || 0.0).toRad(),
                anchor: data.icon.anchor || [0.5, 0.5],
                anchorXUnits: data.icon.anchorXUnits || 'fraction',
                anchorYUnits: data.icon.anchorYUnits || 'fraction',
                opacity: data.icon.opacity || 1,
                size: data.icon.size,
                scale: data.icon.scale,
                src: data.icon.src
            });
        }
        if (data.circle) {
            image = new ol.style.Circle({
                radius: data.circle.radius,
                fill: new ol.style.Fill({ color: data.circle.fillColor }),
                stroke: new ol.style.Stroke({ color: data.circle.strokeColor, width: data.circle.strokeWidth, lineDash: data.circle.lineDash })
            });
        }
        if (data.text) {
            return function (ftr, resolution) {
                if (this instanceof ol.Feature) {
                    resolution = ftr;
                    ftr = this;
                }
                var maxResolution = component.getMapResolutionFromScale(data.text.maxScale || 1000),
                    text;
                var mask = data.text.labelMask;
                var label = Helpers.formatWithObject(mask, ftr.getProperties());
                if (maxResolution >= resolution) {
                    text = new ol.style.Text({
                        font: data.text.font,
                        text: label,
                        offsetX: data.text.offsetX,
                        offsetY: data.text.offsetY,
                        textAlign: data.text.textAlign,
                        textBaseline: data.text.textBaseline,
                        fill: new ol.style.Fill({ color: data.text.fillColor }),
                        stroke: new ol.style.Stroke({ color: data.text.strokeColor, width: data.text.strokeWidth, lineDash: data.text.lineDash })
                    });
                }
                return [new ol.style.Style({
                    stroke: stroke,
                    fill: fill,
                    image: image,
                    text: text
                })];
            };
        } else {
            return new ol.style.Style({
                stroke: stroke,
                fill: fill,
                image: image
            });
        }
    }
    addMarker(feature, layerName = 'markers') {
        let l = this.getLayerBy(layerName);
        if (l) {
            l.getSource().addFeature(feature);
        }
    }
    createMarker(geometry, style, attributes, fid, layerName) {
        let marker = new ol.Feature();
        marker.setId(fid);
        marker.setGeometry(geometry);
        marker.setProperties(attributes);
        marker.setStyle(this.createStyle(style, layerName));
        return marker;
    }
    _ponterClick(event) {
        this._clickedLocation = event.coordinate;
        if (this._flashOnClick) {
            let features = [];
            this._map.forEachFeatureAtPixel(event.pixel, (f, l) => {
                features.push(f);
            });
            if (features.length > 0) {
                this.flash(features[0].getGeometry(), true, 500);
            } else {
                this.flash(new ol.geom.Point(this._clickedLocation), true, 500);
            }
        }
    }
    _pointerMove(event) {
        let hit = this._map.forEachFeatureAtPixel(event.pixel, (f, l) => {
            return true;
        });
        if (hit) {
            this._map.getTargetElement().style.cursor = 'pointer';
        } else {
            this._map.getTargetElement().style.cursor = '';
        }
    }
}

class EventEmitter {
    constructor() { }
    emit(name) {
        let data = [].slice.call(arguments, 1),
            evtArr = ((this.e || (this.e = {}))[name] || []).slice(),
            i = 0,
            len = evtArr.length;
        for (i; i < len; i++) {
            evtArr[i].fn.apply(evtArr[i].ctx, data);
        }
        return this;
    }
    on(name, callback, ctx) {
        let e = this.e || (this.e = {});
        (e[name] || (e[name] = [])).push({
            fn: callback,
            ctx: ctx
        });
        return this;
    }
    once(name, callback, ctx) {
        let self = this,
            listener = function () {
                self.off(name, listener);
                callback.apply(ctx, arguments);
            };
        listener._ = callback;
        return this.on(name, listener, ctx);
    }
    off(name, callback) {
        let e = this.e || (this.e = {}),
            evts = e[name],
            liveEvents = [];
        if (evts && callback) {
            for (let i = 0, len = evts.length; i < len; i++) {
                if (evts[i].fn !== callback && evts[i].fn._ !== callback)
                    liveEvents.push(evts[i]);
            }
        }
        if (liveEvents.length) e[name] = liveEvents;
        else delete e[name];
        return this;
    }
}

class SelectClass extends EventEmitter {
    constructor(config, mapp) {
        super();
        this._mapp = mapp;
        this._isActive = false;
        this._selection = {};
        this._selectableLayers = new Set();
        this._mapp.getLayersBy(true, 'selectable').forEach(l => {
            this._selectableLayers.add(l.get('name'));
        });
        this._useDefaultStyle = (config.useDefaultSelectStyle !== undefined ? config.useDefaultSelectStyle : false);
        this._selectStyle = config.style || {
            fillColor: 'rgba(48,144,199,0.8)',
            strokeColor: '#3399CC',
            strokeWidth: 3,
            radiusRatio: 0.5
        };
        this._dragBox = new ol.interaction.DragBox({
            className: 'ugis-dragbox',
            condition: ol.events.condition.platformModifierKeyOnly
        });
        this._dragBox.on('boxend', e => { this._dragBoxEnd(e); });
        this._mapp.map.addInteraction(this._dragBox);
        this._dragBox.setActive(false);
        this._mapp.map.on('click', (e) => { this._onMapClick(e); });
    }
    get isActive() { return this._isActive; }
    get selection() { return this._selection; }
    get selectStyle() { return this._selectStyle; }
    set selectStyle(style) { this._selectStyle = style; }
    get useDefaultStyle() { return this._useDefaultStyle; }
    set useDefaultStyle(value) { this._useDefaultStyle = value; }
    deactivate() {
        this._isActive = false;
        this._dragBox.setActive(false);
        this.clearSelection();
    }
    selectByClick() {
        if (this._isActive) this.deactivate();
        this._isActive = true;
    }
    selectByWindow() {
        if (this._isActive) this.deactivate();
        this._isActive = true;
        this._dragBox.setActive(true);
    }
    selectFeatures(features, zoomTo = false) {
        let selectionChanged = false;
        if (features.length && features.length > 0) {
            let ids = [];
            features.forEach((ftr) => {
                let f = (ftr instanceof ol.Feature) ? ftr : this._mapp.getFeatureById(ftr);
                if (f && !this.isSelected(f)) {
                    let data = this._mapp.getLayerNameAndFID(f.getId());
                    let l = this._mapp.getLayerBy(data[0]);
                    if (l) {
                        if (this._selection[l.get('name')]) {
                            this._selection[l.get('name')].push(f);
                        } else {
                            this._selection[l.get('name')] = [f];
                        }
                        this._setFeatureStyle(f, l);
                        ids.push(f.getId());
                        selectionChanged = true;
                    }
                }
            });
        }
        if (zoomTo) this._mapp.zoomToFID(ids);
        if (selectionChanged) this._selectionChanged();
    }
    unSelectFeatures(features) {
        let selectionChanged = false;
        if (features.length && features.length > 0) {
            features.forEach((ftr) => {
                let f = (ftr instanceof ol.Feature) ? ftr : this._mapp.getFeatureById(ftr);
                if (f && this.isSelected(f)) {
                    let data = this._mapp.getLayerNameAndFID(f.getId());
                    let l = this._mapp.getLayerBy(data[0]);
                    if (l) {
                        if (this._selection[l.get('name')]) {
                            let index = this._selection[l.get('name')].findIndex(s => s.getId() === f.getId());
                            this._selection[l.get('name')].splice(index, 1);
                        }
                        this._clearFeatureStyle(f);
                        selectionChanged = true;
                    }
                }
            });
        }
        if (selectionChanged) this._selectionChanged();
    }
    isSelected(feature) {
        let id = feature.getId();
        for (let key in this._selection) {
            for (let i = 0; i < this.selection[key].length; i++) {
                if (this.selection[key][i].getId() === id) return true;
            }
        }
        return false;
    }
    clearSelection() {
        for (let key in this._selection) {
            for (let i = 0; i < this.selection[key].length; i++) {
                this._clearFeatureStyle(this.selection[key][i]);
            }
        }
        this._selection = {};
        this._selectionChanged();
    }
    _dragBoxStart() {
        for (let key in this._selection) {
            for (let i = 0; i < this.selection[key].length; i++) {
                this._clearFeatureStyle(this.selection[key][i]);
            }
        }
        this._selection = {};
    }
    _dragBoxEnd() {
        let extent = this._dragBox.getGeometry().getExtent(),
            layers = this._mapp.getLayersBy('operational', 'type');
        let selectionChanged = false;
        let counter = 0;
        layers.forEach(l => {
            let source = l.getSource();
            source.forEachFeatureIntersectingExtent(extent, ftr => {
                if (!this.isSelected(ftr, l)) {
                    this._setFeatureStyle(ftr, l);
                    if (this._selection[l.get('name')]) {
                        this._selection[l.get('name')].push(ftr);
                    } else {
                        this._selection[l.get('name')] = [ftr];
                    }
                    selectionChanged = true;
                }
                counter++;
            });
        });
        if (counter === 0) this.clearSelection();
        else if (selectionChanged) this._selectionChanged();
    }
    _selectionChanged() {
        let array = [];
        for (let key in this._selection) {
            array.push(...this.selection[key]);
        }
        this.emit('select', array);
    }
    _onMapClick(event) {
        if (!this._isActive) return;
        let selectionChanged = false;
        let counter = 0;
        this._mapp.map.forEachFeatureAtPixel(event.pixel, (f, l) => {
            if (!this.isSelected(f, l)) {
                this._setFeatureStyle(f, l);
                if (this._selection[l.get('name')]) {
                    this._selection[l.get('name')].push(f);
                } else {
                    this._selection[l.get('name')] = [f];
                }
                selectionChanged = true;
            }
            counter++;
        });
        if (counter === 0) this.clearSelection();
        else if (selectionChanged) this._selectionChanged();
    }
    _setFeatureStyle(feature, layer) {
        if (this._useDefaultStyle) {
            feature.setStyle(() => {
                let style = this._createSelectStyle(true);
                return [style];
            });
        } else {
            feature.setStyle(() => {
                let styles = layer.getStyle()(feature, this._mapp.getCurrentMapResolution(), false);
                if (feature.getGeometry() instanceof ol.geom.Point)
                    styles.unshift(this._createSelectStyle(false, styles));
                else
                    styles.push(this._createSelectStyle(false, styles));
                return styles;
            });
        }
    }
    _createSelectStyle(defaultStyle, layerStyles) {
        if (defaultStyle) {
            let fill = new ol.style.Fill({
                color: 'rgba(255,255,255,0.8)'
            }),
                stroke = new ol.style.Stroke({
                    color: '#3399CC',
                    width: 3
                }),
                style = new ol.style.Style({
                    image: new ol.style.Circle({
                        fill: fill,
                        stroke: stroke,
                        radius: 6
                    }),
                    fill: fill,
                    stroke: stroke
                });
            return style;
        } else {
            let style;
            if (layerStyles instanceof ol.style.Style) style = layerStyles;
            if (layerStyles.length > 0) style = layerStyles[0];
            if (style) {
                let radius,
                    strokeWidth,
                    stroke = new ol.style.Stroke({
                        color: this._selectStyle.strokeColor,
                        width: this._selectStyle.strokeWidth
                    }),
                    fill = new ol.style.Fill({
                        color: this._selectStyle.fillColor
                    });
                if (style.getImage()) {
                    let size = style.getImage().getSize();
                    size = size.map(i => { return i + (i * this._selectStyle.radiusRatio); });
                    radius = size[0] / 2;
                }
                style = new ol.style.Style({
                    image: new ol.style.Circle({
                        fill: fill,
                        stroke: stroke,
                        radius: radius
                    }),
                    fill: fill,
                    stroke: stroke
                });
            } else {
                let fill = new ol.style.Fill({
                    color: this._selectStyle.fillColor
                });
                let stroke = new ol.style.Stroke({
                    color: this._selectStyle.strokeColor,
                    width: 10
                });
                style = new ol.style.Style({
                    image: new ol.style.Circle({
                        fill: fill,
                        stroke: stroke,
                        radius: this._selectStyle.radius
                    }),
                    fill: fill,
                    stroke: stroke
                });
            }
            return style;
        }
    }
    _clearFeatureStyle(feature) { feature.setStyle(null); }
}

class SearchClass {
    constructor(config, mapp) {
        this._mapp = mapp;
        this._searchSingleUrl = config.searchSingleUrl;
        this._searchAttributesUrl = config.searchAttributesUrl;
        this._searchSpatialUrl = config.searchSpatialUrl;
        this._advanced = config.advanced;
        this._singleLineSearch = config.singleLineSearch;
        if (this._singleLineSearch && this._singleLineSearch.layers) {
            this._searchLayers = [];
            this._singleLineSearch.layers.forEach(l => { this._searchLayers.push(l); });
            if (this._singleLineSearch.attributes) {
                this._searchAttributes = [];
                this._singleLineSearch.attributes.forEach(a => { this._searchAttributes.push(a); });
            }
        }
    }
    get searchLayers() { return this._searchLayers; }
    set searchLayers(layers) { this._searchLayers = layers; }
    get searchAttributes() { return this._searchAttributes; }
    set searchAttributes(attributes) { this._searchAttributes = attributes; }
    get singleSearchUrl() { return this._searchSingleUrl; }
    set singleSearchUrl(url) { this._searchSingleUrl = url; }
    get attributeSearchUrl() { return this._searchAttributesUrl; }
    set attributeSearchUrl(url) { this._searchAttributesUrl = url; }
    get spatialSearchUrl() { return this._searchSpatialUrl; }
    set spatialSearchUrl(url) { this._searchSpatialUrl = url; }
    singleSearch(data) {
        if (!this._searchSingleUrl) console.error('Single line search is not available!');
        return this._executeSearch(this._searchSingleUrl, data);
    }
    attributeSearch(data) {
        if (!this._searchAttributesUrl) console.error('Attributes search is not available!');
        return this._executeSearch(this._searchAttributesUrl, data);
    }
    spatialSearch(data) {
        if (!this._searchSpatialUrl) console.error('Spatial search is not available!');
        return this._executeSearch(this._searchSpatialUrl, data);
    }
    _executeSearch(url, data) {
        return new Promise((res, rej) => {
            fetch(url, {
                method: 'POST',
                body: JSON.stringify(data),
                headers: new Headers({
                    'Content-Type': 'application/json'
                })
            })
                .then(data => {
                    if (!data.ok) throw Error(data.statusText);
                    else return data;
                })
                .then(data => {
                    return data.json();
                })
                .then(data => {
                    res(data);
                })
                .catch(error => {
                    rej(error);
                });
        });
    }
}

class FeatureStatesClass {
    constructor(feature) {
        this._states = [this._clone(feature)];
        this._cur = 0;
    }
    get states() { return this._states; }
    add(state) {
        this._states.push(this._clone(state));
        this._cur++;
    }
    next() {
        if (this._cur + 1 < this._states.length) { this._cur++; return this._states[this._cur]; }
        else return null;
    }
    previous() {
        if (this._cur - 1 > -1) { this._cur--; return this._states[this._cur]; }
        else return null;
    }
    _clone(feature) {
        let newFeature;
        if (feature && feature.clone) {
            newFeature = feature.clone();
            newFeature.setId(feature.getId());
        }
        return newFeature;
    }
}

class TransformClass extends ol.interaction.Pointer {
    constructor(config) {
        super();
        this._handles = new ol.Collection();
        this._overlayLayer = new ol.layer.Vector({
            name: 'Transform overlay',
            showInLegend: false,
            source: new ol.source.Vector({
                features: this._handles,
                useSpatialIndex: false
            }),
            style: (feature) => {
                return (this._style[(feature.get('handle') || 'default') + (feature.get('constraint') || '') + (feature.get('option') || '')]);
            }
        });
        ol.interaction.Pointer.call(this, {
            handleDownEvent: this._handleDownEvent,
            handleDragEvent: this._handleDragEvent,
            handleMoveEvent: this._handleMoveEvent,
            handleUpEvent: this._handleUpEvent
        });
        this._features = config.features;
        this._layers = config.layers ? (config.layers instanceof Array) ? config.layers : [config.layers] : null;
        this.set('translateFeature', (config.translateFeature !== false));
        this.set('translate', (config.translate !== false));
        this.set('stretch', (config.stretch !== false));
        this.set('scale', (config.scale !== false));
        this.set('rotate', (config.rotate !== false));
        this.set('keepAspectRatio', (config.keepAspectRatio || function (e) { return e.originalEvent.shiftKey; }));
        this.on('propertychange', function () {
            this._drawSketch();
        });
        this._setDefaultStyle();
    }
    get Cursors() {
        return {
            'default': 'auto',
            'select': 'pointer',
            'translate': 'move',
            'rotate': 'move',
            'scale': 'ne-resize',
            'scale1': 'nw-resize',
            'scale2': 'ne-resize',
            'scale3': 'nw-resize',
            'scalev': 'e-resize',
            'scaleh1': 'n-resize',
            'scalev2': 'e-resize',
            'scaleh3': 'n-resize'
        };
    }
    setMap(map) {
        if (this.getMap()) this.getMap().removeLayer(this._overlayLayer);
        ol.interaction.Pointer.prototype.setMap.call(this, map);
        this._overlayLayer.setMap(map);
        if (map !== null) {
            this.isTouch = /touch/.test(map.getViewport().className);
            this._setDefaultStyle();
        }
    }
    setActive(b) {
        ol.interaction.Pointer.prototype.setActive.call(this, b);
        if (b) this._select(null);
    }
    _setDefaultStyle() {
        let stroke = new ol.style.Stroke({ color: [255, 0, 0, 1], width: 1 }),
            strokedash = new ol.style.Stroke({ color: [255, 0, 0, 1], width: 1, lineDash: [4, 4] }),
            fill0 = new ol.style.Fill({ color: [255, 0, 0, 0.01] }),
            fill = new ol.style.Fill({ color: [255, 255, 255, 0.8] }),
            circle = new ol.style.RegularShape({
                fill: fill,
                stroke: stroke,
                radius: this.isTouch ? 12 : 6,
                points: 15
            });
        circle.getAnchor()[0] = this.isTouch ? -10 : -5;
        let
            bigpt = new ol.style.RegularShape({
                fill: fill,
                stroke: stroke,
                radius: this.isTouch ? 16 : 8,
                points: 4,
                angle: Math.PI / 4
            }),
            smallpt = new ol.style.RegularShape({
                fill: fill,
                stroke: stroke,
                radius: this.isTouch ? 12 : 6,
                points: 4,
                angle: Math.PI / 4
            }),
            createStyle = function (img, stroke, fill) {
                return [new ol.style.Style({ image: img, stroke: stroke, fill: fill })];
            };
        this._style = {
            'default': createStyle(bigpt, strokedash, fill0),
            'translate': createStyle(bigpt, stroke, fill),
            'rotate': createStyle(circle, stroke, fill),
            'rotate0': createStyle(bigpt, stroke, fill),
            'scale': createStyle(bigpt, stroke, fill),
            'scale1': createStyle(bigpt, stroke, fill),
            'scale2': createStyle(bigpt, stroke, fill),
            'scale3': createStyle(bigpt, stroke, fill),
            'scalev': createStyle(smallpt, stroke, fill),
            'scaleh1': createStyle(smallpt, stroke, fill),
            'scalev2': createStyle(smallpt, stroke, fill),
            'scaleh3': createStyle(smallpt, stroke, fill),
        };
        this._drawSketch();
    }
    _setStyle(style, olstyle) {
        if (!olstyle) return;
        if (olstyle instanceof Array) this._style[style] = olstyle;
        else this._style[style] = [olstyle];
        for (let i = 0; i < this._style[style].length; i++) {
            let im = this._style[style][i].getImage();
            if (im) {
                if (style == 'rotate') im.getAnchor()[0] = -5;
                if (this._isTouch) im.setScale(1.8);
            }
            var tx = this._style[style][i].getText();
            if (tx) {
                if (style == 'rotate') tx.setOffsetX(this._isTouch ? 14 : 7);
                if (this._isTouch) tx.setScale(1.8);
            }
        }
        this._drawSketch();
    }
    _getFeatureAtPixel(pixel) {
        let self = this;
        return this.getMap().forEachFeatureAtPixel(pixel,
            function (feature, layer) {
                let found = false;
                if (!layer) {
                    if (feature === self.bbox_) return false;
                    self._handles.forEach(function (f) { if (f === feature) found = true; });
                    if (found) return { feature: feature, handle: feature.get('handle'), constraint: feature.get('constraint'), option: feature.get('option') };
                }
                if (self._layers) {
                    for (let i = 0; i < self._layers.length; i++) {
                        if (self._layers[i] === layer) return { feature: feature };
                    }
                    return null;
                }
                else if (self._features) {
                    self._features.forEach(function (f) { if (f === feature) found = true; });
                    if (found) return { feature: feature };
                    else return null;
                }
                else return { feature: feature };
            }) || {};
    }
    _drawSketch(center) {
        if(this._overlayLayer) this._overlayLayer.getSource().clear();
        if (!this._feature) return;
        if (center === true) {
            if (!this._ispt) {
                this._overlayLayer.getSource().addFeature(new ol.Feature({ geometry: new ol.geom.Point(this._center), handle: 'rotate0' }));
                let ext = this._feature.getGeometry().getExtent(),
                    geom = ol.geom.Polygon.fromExtent(ext),
                    f = this._bbox = new ol.Feature(geom);
                this._overlayLayer.getSource().addFeature(f);
            }
        }
        else {
            let ext = this._feature.getGeometry().getExtent();
            if (this._ispt) {
                var p = this.getMap().getPixelFromCoordinate([ext[0], ext[1]]);
                ext = ol.extent.boundingExtent(
                    [this.getMap().getCoordinateFromPixel([p[0] - 10, p[1] - 10]),
                    this.getMap().getCoordinateFromPixel([p[0] + 10, p[1] + 10])
                    ]);
            }
            var geom = ol.geom.Polygon.fromExtent(ext);
            var f = this._bbox = new ol.Feature(geom);
            var features = [];
            var g = geom.getCoordinates()[0];
            if (!this._ispt) {
                features.push(f);
                if (this.get('stretch') && this.get('scale')) for (var i = 0; i < g.length - 1; i++) {
                    f = new ol.Feature({ geometry: new ol.geom.Point([(g[i][0] + g[i + 1][0]) / 2, (g[i][1] + g[i + 1][1]) / 2]), handle: 'scale', constraint: i % 2 ? "h" : "v", option: i });
                    features.push(f);
                }
                if (this.get('scale')) for (let i = 0; i < g.length - 1; i++) {
                    f = new ol.Feature({ geometry: new ol.geom.Point(g[i]), handle: 'scale', option: i });
                    features.push(f);
                }
                if (this.get('translate') && !this.get('translateFeature')) {
                    f = new ol.Feature({ geometry: new ol.geom.Point([(g[0][0] + g[2][0]) / 2, (g[0][1] + g[2][1]) / 2]), handle: 'translate' });
                    features.push(f);
                }
            }
            if (this.get('rotate')) {
                f = new ol.Feature({ geometry: new ol.geom.Point(g[3]), handle: 'rotate' });
                features.push(f);
            }
            this._overlayLayer.getSource().addFeatures(features);
        }
    }
    _select(feature) {
        this._feature = feature;
        this._ispt = this._feature ? (this.feature_.getGeometry().getType() == "Point") : false;
        this._drawSketch();
        this.dispatchEvent({ type: 'select', feature: this._feature });
    }
    _handleDownEvent(evt) {
        let sel = this._getFeatureAtPixel(evt.pixel),
            feature = sel.feature;
        if (this._feature && this._feature == feature && ((this._ispt && this.get('translate')) || this.get('translateFeature'))) {
            sel.handle = 'translate';
        }
        if (sel.handle) {
            this._mode = sel.handle;
            this._opt = sel.option;
            this._constraint = sel.constraint;
            this._coordinate = evt.coordinate;
            this._pixel = evt.pixel;
            this._geom = this._feature.getGeometry().clone();
            this._extent = (ol.geom.Polygon.fromExtent(this._geom.getExtent())).getCoordinates()[0];
            this._center = ol.extent.getCenter(this._geom.getExtent());
            this._angle = Math.atan2(this._center[1] - evt.coordinate[1], this._center[0] - evt.coordinate[0]);
            this.dispatchEvent({ type: this._mode + 'start', feature: this._feature, pixel: evt.pixel, coordinate: evt.coordinate });
            return true;
        }
        else {
            this._feature = feature;
            this._ispt = this._feature ? (this._feature.getGeometry().getType() == "Point") : false;
            this._drawSketch();
            this.dispatchEvent({ type: 'select', feature: this._feature, pixel: evt.pixel, coordinate: evt.coordinate });
            return false;
        }
    }
    _handleDragEvent(evt) {
        switch (this._mode) {
            case 'rotate':
                {
                    let a = Math.atan2(this._center[1] - evt.coordinate[1], this._center[0] - evt.coordinate[0]);
                    if (!this._ispt) {
                        let geometry = this._geom.clone();
                        geometry.rotate(a - this._angle, this._center);
                        this._feature.setGeometry(geometry);
                    }
                    this._drawSketch(true);
                    this.dispatchEvent({ type: 'rotating', feature: this._feature, angle: a - this._angle, pixel: evt.pixel, coordinate: evt.coordinate });
                    break;
                }
            case 'translate':
                {
                    var deltaX = evt.coordinate[0] - this._coordinate[0];
                    var deltaY = evt.coordinate[1] - this._coordinate[1];
                    this._feature.getGeometry().translate(deltaX, deltaY);
                    this._handles.forEach(function (f) {
                        f.getGeometry().translate(deltaX, deltaY);
                    });
                    this._coordinate = evt.coordinate;
                    this.dispatchEvent({ type: 'translating', feature: this._feature, delta: [deltaX, deltaY], pixel: evt.pixel, coordinate: evt.coordinate });
                    break;
                }
            case 'scale':
                {
                    let center = this._center;
                    if (evt.originalEvent.metaKey || evt.originalEvent.ctrlKey) {
                        center = this._extent[(Number(this._opt) + 2) % 4];
                    }
                    let scx = (evt.coordinate[0] - center[0]) / (this._coordinate[0] - center[0]),
                        scy = (evt.coordinate[1] - center[1]) / (this._coordinate[1] - center[1]);
                    if (this._constraint) {
                        if (this._constraint == "h") scx = 1;
                        else scy = 1;
                    }
                    else {
                        if (this.get('keepAspectRatio')(evt))
                        {
                            scx = scy = Math.min(scx, scy);
                        }
                    }
                    let geometry = this._geom.clone();
                    geometry.applyTransform(function (g1, g2, dim) {
                        if (dim < 2) return g2;
                        for (i = 0; i < g1.length; i += dim) {
                            if (scx != 1) g2[i] = center[0] + (g1[i] - center[0]) * scx;
                            if (scy != 1) g2[i + 1] = center[1] + (g1[i + 1] - center[1]) * scy;
                        }
                        return g2;
                    });
                    this._feature.setGeometry(geometry);
                    this._drawSketch();
                    this.dispatchEvent({ type: 'scaling', feature: this._feature, scale: [scx, scy], pixel: evt.pixel, coordinate: evt.coordinate });
                    break;
                }
            default: break;
        }
    }
    _handleMoveEvent(evt) {
        if (!this._mode) {
            let map = evt.map,
                sel = this._getFeatureAtPixel(evt.pixel),
                element = evt.map.getTargetElement();
            if (sel.feature) {
                var c = sel.handle ? this.Cursors[(sel.handle || 'default') + (sel.constraint || '') + (sel.option || '')] : this.Cursors.select;
                if (this._previousCursor === undefined) {
                    this._previousCursor = element.style.cursor;
                }
                element.style.cursor = c;
            }
            else {
                if (this._previousCursor !== undefined) element.style.cursor = this._previousCursor;
                this._previousCursor = undefined;
            }
        }
    }
    _handleUpEvent(evt) {
        this.dispatchEvent({ type: this._mode + 'end', feature: this._feature, oldgeom: this._geom });
        this._drawSketch();
        this._mode = null;
        return false;
    }
}

class EditorClass extends EventEmitter {
    constructor(config, mapp, select) {
        super();
        this._mapp = mapp;
        this._select = select;
        this._isEditing = false;
        this._states = new Map();
        this._fid = -1;
        this.on('startediting', e => {
            this._select.selectByClick();
        });
        this.on('stopediting', e => {
            this.deactivateDraw();
            this.deactivateModify();
            this.deactivateMove();
            this._select.deactivate();
        });
        this._curFeature = null;
        this.on('created', ftr => { this._curFeature = ftr; });
        this.on('updated', ftr => { this._curFeature = ftr; });
        this.on('deleted', ftr => { this.update(ftr); });
        this._featureType = {
            POINT: 'Point',
            LINE_STRING: 'LineString',
            POLYGON: 'Polygon'
        };
        this._layer = null;
        if (config.layer) {
            this._layer = this._mapp.createOperationalLayer(config.layer);
        } else {
            this._layer = this._mapp.createOperationalLayer({
                name: 'editor',
                zIndex: 901,
                showInLegend: false,
                visible: true,
                maxScale: 10000000,
                source: new ol.source.Vector({
                    features: new ol.Collection()
                })
            });
        }
        this._mapp.map.addLayer(this._layer);
        this._snap = {};
        this._draw = {};
        this._modify = {};
        this._move = {};
        this._transform = {};
    }
    get isEditing() { return this._isEditing; }
    set isEditing(value) {
        if (value) this.emit('startediting');
        else this.emit('stopediting');
        this._isEditing = value;
    }
    get featureType() { return this._featureType; }
    get curentFeature() { return this._curFeature; }
    get editableLayers() {
        return this._editableLayers || [{
            label: 'Point',
            name: 'editor',
            value: this._featureType.POINT
        }, {
            label: 'Line String',
            name: 'editor',
            value: this._featureType.LINE_STRING
        }, {
            label: 'Polygon',
            name: 'editor',
            value: this._featureType.POLYGON
        }];
    }
    start() {
        this.isEditing = true;
    }
    stop(saveEdits = true) {
        this.isEditing = false;
    }
    save() {
    }
    create(feature, layer) {
        if (this.isEditing) {
            feature.setId(layer.get('name') + '.' + this._fid);
            this._fid--;
            if (!this._states.has(feature.getId())) {
                this._states.set(feature.getId(), new FeatureStatesClass(feature));
            } else {
                console.error('Feature is already added to states, FID:' + feature.getId());
            }
            this.emit('created', feature);
        }
    }
    update(oldState, newState) {
        if (this.isEditing) {
            if (this._states.has(oldState.getId())) {
                this._states.get(oldState.getId()).add(newState);
            } else {
                this._states.set(oldState.getId(), new FeatureStatesClass(oldState));
                this._states.get(oldState.getId()).add(newState);
            }
            this.emit('updated', newState);
        }
    }
    delete(feature) {
        if (this.isEditing) {
            let layer = this._mapp.getLayerForFeature(feature.getId());
            if (layer) {
                layer.getSource().removeFeature(feature);
                this.emit('deleted', feature);
            }
        }
    }
    undo() {
        if (this.isEditing) {
            if (this._draw.getActive()) {
                this._draw.removeLastPoint();
            } else {
                if (this._states.has(this._curFeature.getId())) {
                    let state = this._states.get(this._curFeature.getId()).previous();
                    if (state) {
                        this._curFeature.setProperties(state.getProperties());
                    }
                }
            }
        }
    }
    redo() {
        if (this.isEditing && !this._draw.getActive()) {
            if (this._states.has(this._curFeature.getId())) {
                let state = this._states.get(this._curFeature.getId()).next();
                if (state) {
                    this._curFeature.setProperties(state.getProperties());
                }
            }
        }
    }
    draw(featureType = this._featureType.POINT, layer = this._layer) {
        if (this.isEditing) {
            if (this._draw.getActive && this._draw.getActive()) {
                this.deactivateDraw();
            }
            this._draw = new ol.interaction.Draw({
                source: layer.getSource(),
                type: featureType
            });
            this._draw.on('drawend', e => {
                let feature = e.feature;
                if (feature) {
                    this.create(feature, layer);
                }
            });
            this._mapp.map.addInteraction(this._draw);
            this._snap = new ol.interaction.Snap({
                source: layer.getSource()
            });
            this._mapp.map.addInteraction(this._snap);
        }
    }
    modify(feature = this._select.selection) {
        if (this.isEditing) {
            let oldFeature;
            if (this._modify.getActive && this._modify.getActive()) {
                this.deactivateModify();
            }
            this._modify = new ol.interaction.Modify({
                features: feature,
                deleteCondition: (e) => {
                    return ol.events.condition.shiftKeyOnly(e) && ol.events.condition.singleClick(e);
                }
            });
            this._modify.on('modifystart', e => {
                let feature = e.features.getArray()[0];
                if (feature) {
                    oldFeature = feature;
                }
            });
            this._modify.on('modifyend', e => {
                let feature = e.features.getArray()[0];
                if (feature) {
                    this.update(oldFeature, feature);
                }
            });
            this._mapp.map.addInteraction(this._modify);
        }
    }
    move(feature = this._select.selection) {
        if (this.isEditing) {
            let oldFeature;
            if (this._move.getActive && this._move.getActive()) {
                this.deactivateMove();
            }
            this._move = new ol.interaction.Translate({
                features: feature
            });
            this._move.on('translatestart', e => {
                let feature = e.features.getArray()[0];
                if (feature) {
                    oldFeature = feature;
                }
            });
            this._move.on('translateend', e => {
                this.deactivateMove();
                let feature = e.features.getArray()[0];
                if (feature) {
                    this.update(oldFeature, feature);
                }
            });
            this._mapp.map.addInteraction(this._move);
        }
    }
    deactivateDraw() {
        this._mapp.map.removeInteraction(this._snap);
        this._snap = {};
        this._mapp.map.removeInteraction(this._draw);
        this._draw = {};
    }
    deactivateModify() {
        this._mapp.map.removeInteraction(this._modify);
        this._modify = {};
    }
    deactivateMove() {
        this._mapp.map.removeInteraction(this._move);
        this._move = {};
    }
    trans() {
        this.deactivateDraw();
        this._select.deactivate();
        this._transform = new TransformClass({
            translateFeature: false,
            scale: false,
            rotate: true,
            keepAspectRatio: ol.events.condition.always,
            translate: true,
            stretch: false,
        });
        this._mapp.map.addInteraction(this._transform);
    }
    deact() {
        this._mapp.map.removeInteraction(this._transform);
        this._transform = {};
    }
}

class GeocodeClass {
    constructor(config) {
        this._service = config.service;
        this._providers = [{
            label: 'Google',
            value: 'google'
        }, {
            label: 'OpenStreetMap',
            value: 'openstreetmap'
        }];
    }
    get providers() { return this._providers; }
    geocodeByAddress(address, provider = 'google', format = 'json') {
        return this._executeGeocode(this._constructUrl(address, provider, format));
    }
    geocodeByLocation(latitude, longitude, provider = 'google', format = 'json') {
        return this._executeGeocode(this._constructUrl(Helpers.format('{0};{1}', latitude, longitude), provider, format));
    }
    _constructUrl(location, provider = 'google', format = 'json') {
        return Helpers.format('{0}{1}/{2}/{3}', this._service, provider, format, location);
    }
    _executeGeocode(url) {
        return new Promise((res, rej) => {
            fetch(url, {
                method: 'GET',
                headers: new Headers({
                    'Content-Type': 'application/json'
                })
            })
                .then(data => {
                    if (!data.ok) throw Error(data.statusText);
                    else return data;
                })
                .then(data => {
                    return data.json();
                })
                .then(data => {
                    res(data);
                })
                .catch(error => {
                    rej(error);
                });
        });
    }
}

class BookmarksClass {
    constructor(config, mapp) {
        this._mapp = mapp;
        this._service = config.service;
        this._moved = true;
        this._views = [];
        this._curViewIndex = -1;
        this._mapp.map.on('moveend', (e) => { this._registeredMapMoveFunction(e); });
    }
    getBookmarks(user) {
        return new Promise((res, rej) => {
            fetch(this._service + user, {
                method: 'GET',
                headers: new Headers({
                    'Content-Type': 'application/json'
                })
            })
                .then(data => {
                    if (!data.ok) throw Error(data.statusText);
                    else return data;
                })
                .then(data => {
                    return data.json();
                })
                .then(data => {
                    res(data);
                })
                .catch(error => {
                    rej(error);
                });
        });
    }
    activateBookmark(bookmark) {
        if (bookmark && bookmark.bookmark) {
            let center = [bookmark.bookmark.view.longitude, bookmark.bookmark.view.latitude];
            this._mapp.center = center;
            this._mapp.zoom = bookmark.bookmark.view.zoomLevel;
            this._mapp.rotation = bookmark.bookmark.view.rotation;
            bookmark.bookmark.layers.forEach(item => {
                let layer = this._mapp.getLayerBy(item.name);
                if (layer) {
                    layer.setVisible(item.visible);
                }
            });
        }
    }
    create(user, name) {
        let
            center = this._mapp.center,
            layers = this._scanMapLayers(),
            newBookmark = {
                owner: user,
                name: name,
                bookmark: {
                    layers: layers,
                    view: {
                        latitude: center[1],
                        longitude: center[0],
                        zoomLevel: this._mapp.zoom,
                        rotation: this._mapp.rotation
                    }
                }
            };
        return new Promise((res, rej) => {
            fetch(this._service, {
                method: 'POST',
                body: JSON.stringify(newBookmark),
                headers: new Headers({
                    'Content-Type': 'application/json'
                })
            })
                .then(data => {
                    if (!data.ok) throw Error(data.statusText);
                    else return data;
                })
                .then(data => {
                    return data.json();
                })
                .then(data => {
                    res(data);
                })
                .catch(error => {
                    rej(error);
                });
        });
    }
    delete(id) {
        return new Promise((res, rej) => {
            fetch(this._service + id, {
                method: 'DELETE',
                headers: new Headers({
                    'Content-Type': 'application/json'
                })
            })
                .then(data => {
                    if (!data.ok) throw Error(data.statusText);
                    else return data;
                })
                .then(data => {
                    return data.json();
                })
                .then(data => {
                    res(data);
                })
                .catch(error => {
                    rej(error);
                });
        });
    }
    previousExtent() {
        if (this._views[this._curViewIndex - 1]) {
            this._mapp.map.getView().setZoom(this._views[this._curViewIndex - 1].zoom);
            this._mapp.map.getView().setCenter(this._views[this._curViewIndex - 1].center);
            this._mapp.map.getView().setRotation(this._views[this._curViewIndex - 1].rotation);
            this._curViewIndex--;
            this._moved = false;
        }
    }
    nextExtent() {
        if (this._views[this._curViewIndex + 1]) {
            this._mapp.map.getView().setZoom(this._views[this._curViewIndex + 1].zoom);
            this._mapp.map.getView().setCenter(this._views[this._curViewIndex + 1].center);
            this._mapp.map.getView().setRotation(this._views[this._curViewIndex + 1].rotation);
            this._curViewIndex++;
            this._moved = false;
        }
    }
    initialExtent() {
        if (this._views[0]) {
            this._mapp.map.getView().setZoom(this._views[0].zoom);
            this._mapp.map.getView().setCenter(this._views[0].center);
            this._mapp.map.getView().setRotation(this._views[0].rotation);
            this._moved = false;
        }
    }
    _scanMapLayers() {
        let
            result = [],
            baseLayers = this._mapp.getLayersBy('base', 'type'),
            vectorLayers = this._mapp.getLayersBy('operational', 'type');
        baseLayers.forEach(layer => {
            result.push({
                name: layer.get('name'),
                visible: layer.getVisible()
            });
        });
        vectorLayers.forEach(layer => {
            result.push({
                name: layer.get('name'),
                visible: layer.getVisible()
            });
        });
        return result;
    }
    _registeredMapMoveFunction(event) {
        if (this._moved) {
            this._views = this._views.slice(0, this._curViewIndex + 1);
            this._views.push({
                zoom: event.map.getView().getZoom(),
                center: event.map.getView().getCenter(),
                rotation: event.map.getView().getRotation()
            });
            this._curViewIndex++;
        }
        this._moved = true;
    }
}

class ElevationProfileClass {
    constructor(config, mapp) {
        this._mapp = mapp;
        this._elevationService = config.elevationServiceUrl;
        this._profileService = config.profileServiceUrl;
        this._defaultWidth = config.defaultWidth || 600;
        this._defaultHeight = config.defaultHeight || 200;
        this._showLabels = (config.showLabels !== undefined) ? config.showLabels : true;
        this._liveProfile = (config.liveProfile !== undefined) ? config.liveProfile : false;
        this._format = new ol.format.GeoJSON();
    }
    get defaultWidth() { return this._defaultWidth; }
    set defaultWidth(width) { this._defaultWidth = width; }
    get defaultHeight() { return this._defaultHeight; }
    set defaultHeight(height) { this._defaultHeight = height; }
    get showLabels() { return this._showLabels; }
    set showLabels(show) { this._showLabels = show; }
    get liveProfile() { return this._liveProfile; }
    set liveProfile(active) { this._liveProfile = active; }
    generateProfileFor(feature, width = this._defaultWidth, height = this._defaultHeight) {
        let geometry = feature.getGeometry();
        if (!geometry) {
            return;
        }
        if (geometry instanceof ol.geom.MultiLineString) {
            geometry = geometry.getLineStrings()[0];
        }
        let
            track = this._format.writeGeometry(geometry, {
                dataProjection: 'EPSG:4326',
                featureProjection: this._mapp.projection
            }),
            data = {
                track: JSON.parse(track),
                params: {
                    width: width - 50,
                    height: height - 50
                }
            };
        return new Promise((res, rej) => {
            fetch(this._profileService, {
                method: 'POST',
                body: JSON.stringify(data),
                headers: new Headers({
                    'Content-Type': 'application/json'
                })
            })
                .then(data => {
                    if (!data.ok) throw Error(data.statusText);
                    else return data;
                })
                .then(data => {
                    return data.json();
                })
                .then(data => {
                    res(data);
                })
                .catch(error => {
                    rej(error);
                });
        });
    }
    getElevationFor(lonlat, format = 'valonly') {
        return new Promise((res, rej) => {
            fetch(Helpers.format('{0}{1}/{2},{3}', this._elevationService, format, lonlat[1], lonlat[0]), {
                method: 'GET'
            })
                .then(data => {
                    if (!data.ok) throw Error(data.statusText);
                    else return data;
                })
                .then(data => {
                    return data.json();
                })
                .then(data => {
                    res(data);
                })
                .catch(error => {
                    rej(error);
                });
        });
    }
}

class AttachmentsClass {
    constructor(config, select) {
        this._select = select;
        this._service = config.service;
    }
    getFor(feature) {
        if (feature instanceof ol.Feature) return this._getAttachments(this._service + feature.getId());
        else return this._getAttachments(this._service + feature);
    }
    addFor(feature, attachment) {
    }
    deleteFor(feature, attachment) {
    }
    _getAttachments(url) {
        return new Promise((res, rej) => {
            fetch(url, {
                method: 'GET',
                headers: new Headers({
                    'Content-Type': 'application/json'
                })
            })
                .then(data => {
                    if (!data.ok) throw Error(data.statusText);
                    else return data;
                })
                .then(data => {
                    return data.json();
                })
                .then(data => {
                    res(data);
                })
                .catch(error => {
                    rej(error);
                });
        });
    }
}

class MeasureClass {
    constructor(config, mapp, select) {
        config.style = config.style || {
            name: 'default',
            fillColor: 'rgba(255, 255, 255, 0.2)',
            strokeColor: 'rgba(0, 0, 0, 0.5)',
            strokeWidth: 2,
            lineDash: [10, 10],
            circle: {
                radius: 5,
                fillColor: 'rgba(255, 255, 255, 0.2)',
                strokeColor: 'rgba(0, 0, 0, 0.7)',
                strokeWidth: 2
            }
        };
        let styleFactory = new StylesClass();
        this.geomUtils = new GeomUtils();
        this._drawStyle = styleFactory.createStyle(config.style);
        this._mapp = mapp;
        this._select = select;
        this._draw = {};
    }
    measureArea() {
        return new Promise((yes, no) => {
            this._activate('Polygon');
            this._draw.on('drawend', (event) => {
                let area = this.geomUtils.getGeodeticArea(event.feature.getGeometry(), this._mapp.projection, 'EPSG:4326');
                yes({
                    feature: event.feature,
                    value: area
                });
            });
        });
    }
    measureDistance() {
        return new Promise((yes, no) => {
            this._activate('LineString');
            this._draw.on('drawend', (event) => {
                let dist = this.geomUtils.getGeodeticLength(event.feature.getGeometry(), this._mapp.projection, 'EPSG:4326');
                yes({
                    feature: event.feature,
                    value: dist
                });
            });
        });
    }
    measureLocation() {
        return new Promise((yes, no) => {
            this._activate('Point');
            this._draw.on('drawend', (event) => {
                yes({
                    feature: event.feature,
                    value: ''
                });
            });
        });
    }
    measureFeature(returnProfile = false) {
        return new Promise((yes, no) => {
            yes('not implemented yet');
        });
    }
    _activate(type) {
        this._draw = new ol.interaction.Draw({
            source: new ol.source.Vector({
                features: new ol.Collection()
            }),
            type: type,
            style: this._drawStyle
        });
        this._draw.on('drawend', (event) => {
            setTimeout(() => { this._deactivate(); }, 100);
        });
        this._mapp.map.addInteraction(this._draw);
    }
    _deactivate() {
        this._mapp.map.removeInteraction(this._draw);
        this._draw = {};
    }
}

class InfoWindowClass {
    constructor(config, mapp) {
        this._mapp = mapp;
        this._container = document.createElement('div');
        this._container.className = 'ol-popup';
        this._closer = document.createElement('a');
        this._closer.className = 'ol-popup-closer';
        this._closer.href = '#';
        this._container.appendChild(this._closer);
        this._closer.onclick = (e) => {
            this.hide();
            e.preventDefault();
        };
        this._content = document.createElement('div');
        this._content.className = 'ol-popup-content';
        this._container.appendChild(this._content);
        this._enableTouchScroll(this._content);
        this.overlay = new ol.Overlay({
            element: this._container,
            autoPan: (config.autoPan !== undefined) ? config.autoPan : true,
            autoPanAnimation: (config.autoPanAnimation !== undefined) ? config.autoPanAnimation : { duration: 250 }
        });
        this._mapp.map.addOverlay(this.overlay);
    }
    show(coord, html) {
        if (html instanceof HTMLElement) {
            this._content.innerHTML = '';
            this._content.appendChild(html);
        } else {
            this._content.innerHTML = html;
        }
        this._container.style.display = 'block';
        this._content.scrollTop = 0;
        this.overlay.setPosition(coord);
    }
    hide() {
        this._container.style.display = 'none';
    }
    isOpened() {
        return this._container.style.display == 'block';
    }
    _isTouchDevice() {
        try {
            document.createEvent("TouchEvent");
            return true;
        } catch (e) {
            return false;
        }
    }
    _enableTouchScroll(element) {
        if (this._isTouchDevice()) {
            let scrollStartPos = 0;
            element.addEventListener("touchstart", function (event) {
                scrollStartPos = this.scrollTop + event.touches[0].pageY;
            }, false);
            element.addEventListener("touchmove", function (event) {
                this.scrollTop = scrollStartPos - event.touches[0].pageY;
            }, false);
        }
    }
}

class UserLocationClass {
    constructor(config, mapp) {
        let style = config.style || { circle: { fillColor: '#FFFF00', strokeColor: '#1589FF', radius: 10, strokeWidth: 5 } };
        this._flash = config.flash || {
            red: 0,
            green: 255,
            blue: 0
        };
        this._mapp = mapp;
        this._watching = false;
        this._zoomTo = true;
        this._userLocation = this._mapp.createMarker(new ol.geom.Point([0, 0]), style, {}, '1');
        this._watchId = null;
        this._timeout = null;
        let buttons = this._createGPSButtons(config);
        document.getElementById('mapp').appendChild(buttons);
        this._control = new ol.control.Control({
            element: buttons
        });
        this._mapp.map.addControl(this._control);
    }
    get watching() { return this._watching; }
    _activate(event) {
        if (navigator.geolocation) {
            let source = this._mapp.getLayerBy('markers').getSource();
            if (this._watching) {
                source.removeFeature(this._userLocation);
                navigator.geolocation.clearWatch(this._watchId);
                event.target.parentElement.classList.remove('user-location-active');
                clearTimeout(this._timeout);
                this._watching = false;
            } else {
                source.addFeature(this._userLocation);
                this._watchId = navigator.geolocation.watchPosition(
                    (location) => { this._showPosition(location); },
                    (error) => { console.error('(' + error.code + '): ' + error.message); },
                    { enableHighAccuracy: false, timeout: 15000, maximumAge: 0 }
                );
                event.target.parentElement.classList.add('user-location-active');
                this._timeout = setInterval(() => { this._flashLocation(); }, 2000);
                this._watching = true;
            }
        }
    }
    _showPosition(location) {
        let
            pnt = ol.proj.transform([location.coords.longitude, location.coords.latitude], 'EPSG:4326', 'EPSG:3857'),
            extent = ol.extent.buffer([pnt[0], pnt[1], pnt[0], pnt[1]], 500);
        this._userLocation.setGeometry(new ol.geom.Point(pnt));
        if (this._flash) this._flashLocation();
    }
    _flashLocation() {
        this._mapp.flash(this._userLocation.getGeometry(), true, 1000, this._flash.red, this._flash.green, this._flash.blue);
    }
    _zoom(event) {
        this._mapp.zoomTo(this._userLocation.getGeometry().getExtent());
    }
    _createGPSButtons(config = {}) {
        let div = document.createElement('div');
        div.setAttribute('id', 'user-location');
        div.setAttribute('class', 'ol-unselectable ol-control user-location');
        let button = document.createElement('button');
        button.setAttribute('id', 'get-my-location');
        button.setAttribute('title', config.myLocationTitle || 'My location');
        button.onclick = (e) => { this._activate(e); };
        let zoomTo = document.createElement('button');
        zoomTo.setAttribute('id', 'zoom-to-my-location');
        zoomTo.setAttribute('title', config.zoomToTitle || 'Zoom To');
        zoomTo.onclick = (e) => { this._zoom(e); };
        div.appendChild(button);
        div.appendChild(zoomTo);
        return div;
    }
}

class MouseLocationClass extends EventEmitter {
    constructor(config, mapp) {
        super();
        this._mapp = mapp;
        this._location = [];
        this._scale = 1;
        this._precision = config.precision || 6;
        this._showMapScale = config.showMapScale;
        this._projection = config.projection || 'EPSG:4326';
        this._createControl = (config.createControl !== undefined ? config.createControl : true);
        if (this._createControl) {
            let element = this._createElement();
            document.getElementById('mapp').appendChild(element);
            this._control = new ol.control.Control({
                element: element
            });
            this._mapp.map.addControl(this._control);
        }
        this._mapp.map.on('pointermove', (e) => { this._formatCoordinates(e.coordinate); });
    }
    setProperties(options) {
        if (options.showMapScale) this._showMapScale = options.showMapScale;
        if (options.precision) this._precision = options.precision;
        if (options.projection) this._projection = options.projection;
    }
    _formatCoordinates(coordinate) {
        if (this._useUTM) {
        } else {
            let res = '';
            this._location = ol.proj.transform(coordinate, this._mapp.projection, this._projection);
            this._location = ol.coordinate.toStringXY(this._location, this._precision).split(', ');
            if (this._showMapScale) {
                this._scale = this._mapp.getMapScale(true).toLocaleString('bg-BG');
                res = Helpers.format('{0}, {1} 1:{2}', this._location[1], this._location[0], this._scale);
            } else {
                res = Helpers.format('{0}, {1}', this._location[1], this._location[0]);
            }
            if (this._createControl) {
                this._control.element.getElementsByClassName('mouse-coordinates')[0].innerHTML = res;
            }
        }
        this.emit('mousemove', {
            scale: this._scale,
            latitude: this._location[1],
            longitude: this._location[0]
        });
        return '';
    }
    _createElement() {
        let div = document.createElement('div');
        div.setAttribute('id', 'mouse-location');
        div.setAttribute('class', 'ol-unselectable ol-control my-control mouse-location');
        let position = document.createElement('button');
        position.setAttribute('class', 'mouse-coordinates');
        div.appendChild(position);
        return div;
    }
}

class LayerSwitcherClass {
    constructor(config, mapp) {
        this._mapp = mapp;
        this._createControl = (config.createControl !== undefined ? config.createControl : true);
        if (this._createControl) {
            this._hiddenClass = 'ol-unselectable ol-control layer-switcher';
            this._shownClass = this._hiddenClass + ' shown';
            this._panel = null;
            this._element = this._createElement(config);
            this._control = new ol.control.Control({
                element: this._element
            });
            this._mapp.map.addControl(this._control);
            this._mapp.map.on('pointerdown', () => {
                this._hidePanel();
            });
            this._mapp.map.getView().on('change:resolution', () => {
                if (this._element.className === this._shownClass) {
                    this._hidePanel();
                    this._showPanel();
                }
            });
        }
    }
    get basemaps() { return this._mapp.basemaps; }
    get layers() { return this._mapp.layers; }
    legendStyleFor(layer) {
        if (typeof layer === 'string') {
            layer = this._mapp.getLayerBy(layer);
        }
        if (!layer) return;
        let svg, visible = false;
        if ((this._mapp.getCurrentMapResolution() >= layer.get('minResolution')) &&
            (this._mapp.getCurrentMapResolution() <= layer.get('maxResolution'))) {
            visible = true;
            if (layer.getStyle) {
                svg = layer.getStyle()(null, null, true);
            } else {
                let row = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                row.setAttribute('width', '100%');
                let image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
                image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', layer.get('icon'));
                image.setAttribute('x', 0);
                image.setAttribute('y', 0);
                row.appendChild(image);
                svg = row;
            }
        }
        return {
            visible: visible,
            symbology: svg
        };
    }
    _createElement(config = {}) {
        let div = document.createElement('div');
        div.setAttribute('class', this._hiddenClass);
        let button = document.createElement('button');
        button.setAttribute('title', config.legendTitle || 'Legend');
        button.onclick = (e) => { this._showPanel(e); };
        this._panel = document.createElement('div');
        this._panel.setAttribute('class', 'panel scrollable-panel');
        div.appendChild(button);
        div.appendChild(this._panel);
        return div;
    }
    _showPanel() {
        if (this._element.className != this._shownClass) {
            this._element.className = this._shownClass;
            this._renderPanel();
        } else {
            this._hidePanel();
        }
    }
    _hidePanel() {
        if (this._element.className != this._hiddenClass) {
            this._element.className = this._hiddenClass;
        }
    }
    _renderPanel() {
        this._ensureTopVisibleBaseLayerShown();
        while (this._panel.firstChild) {
            this._panel.removeChild(this._panel.firstChild);
        }
        let ul = document.createElement('ul');
        this._panel.appendChild(ul);
        this._renderLayers(this._mapp.map, ul);
    }
    _ensureTopVisibleBaseLayerShown() {
        let lastVisibleBaseLyr;
        this._forEachLayerRecursive(this._mapp.map, (l, idx, a) => {
            if (l.get('type') === 'base' && l.getVisible()) {
                lastVisibleBaseLyr = l;
            }
        });
        if (lastVisibleBaseLyr) this._setVisible(lastVisibleBaseLyr, true);
    }
    _setVisible(lyr, visible) {
        let map = this._mapp.map;
        lyr.setVisible(visible);
        if (visible && lyr.get('type') === 'base') {
            this._forEachLayerRecursive(map, (l, idx, a) => {
                if (l != lyr && l.get('type') === 'base') {
                    l.setVisible(false);
                }
            });
        }
    }
    _renderLayer(lyr, idx) {
        let
            li = document.createElement('li'),
            lyrTitle = lyr.get('title'),
            lyrId = lyr.get('title').replace(' ', '-') + '_' + idx, label = document.createElement('label'),
            input = document.createElement('input');
        if (lyr.getLayers) {
            li.className = 'group';
            let ul = document.createElement('ul');
            if (lyr.get('disabledInLegend') === false) {
                input.name = 'group-' + lyrTitle;
                input.type = 'checkbox';
                input.id = lyrId;
                input.checked = lyr.get('visible');
                input.onchange = (e) => {
                    let visible = e.target.checked;
                    this._setVisible(lyr, visible);
                    let lis = e.target.parentElement.getElementsByTagName('li');
                    for (let i = 0; i < lis.length; i++) {
                        lis[i].getElementsByTagName('input')[0].checked = visible;
                    }
                    lyr.getLayers().getArray().forEach((layer) => {
                        layer.setVisible(visible);
                    });
                };
                li.appendChild(input);
            }
            label.htmlFor = lyrId;
            label.innerHTML = lyrTitle;
            let legendData = this.legendStyleFor(lyr);
            if (!legendData.visible) {
                li.style.color = '#c5c5c5';
            } else {
                if (legendData.symbology)
                    li.appendChild(legendData.symbology);
            }
            li.appendChild(label);
            li.appendChild(ul);
            this._renderLayers(lyr, ul);
        } else {
            if (lyr.get('disabledInLegend') === false) {
                if (lyr.get('type') === 'base') {
                    input.type = 'radio';
                    input.name = 'base';
                } else {
                    input.type = 'checkbox';
                }
                input.id = lyrId;
                input.checked = lyr.get('visible');
                input.onchange = (e) => {
                    this._setVisible(lyr, e.target.checked);
                };
                li.appendChild(input);
            }
            label.htmlFor = lyrId;
            label.innerHTML = lyrTitle;
            li.appendChild(label);
            let legendData = this.legendStyleFor(lyr);
            if (!legendData.visible) {
                li.style.color = '#c5c5c5';
            } else {
                if (legendData.symbology)
                    li.appendChild(legendData.symbology);
            }
        }
        return li;
    }
    _renderLayers(lyr, elm) {
        var lyrs = lyr.getLayers().getArray().slice().reverse();
        for (var i = 0, l; i < lyrs.length; i++) {
            l = lyrs[i];
            if (l.get('title') && l.get('showInLegend')) {
                elm.appendChild(this._renderLayer(l, i));
            }
        }
    }
    _forEachLayerRecursive(lyr, fn) {
        lyr.getLayers().forEach((lyr, idx, a) => {
            fn(lyr, idx, a);
            if (lyr.getLayers) {
                this._forEachLayerRecursive(lyr, fn);
            }
        });
    }
}

class UGisApp {
    constructor(config) {
        this._config = config;
        this._widgets = {};
        this._mapp = {};
        Resources.current = Helpers.urlParam('l') || 'en';
    }
    createMap(target) {
        this._mapp = new MappClass(this._config, target);
        return this._mapp;
    }
    checkUrlParameters() {
        let parameters = Helpers.urlParams();
        if (parameters.v) {
            let latlonzoomrot = parameters.v.split(',', 4).map(Number);
            this._mapp.positionAt({
                zoom: latlonzoomrot[2] || this._mapp.zoom,
                rotation: (latlonzoomrot[3] || this._mapp.rotation).toRad(),
                center: ol.proj.transform([latlonzoomrot[1], latlonzoomrot[0]], 'EPSG:4326', this._mapp.projection)
            });
        }
        if (parameters.c) {
            let latlon = parameters.c.split(',', 2).map(Number);
            this._mapp.center = ol.proj.transform([latlon[1], latlon[0]], 'EPSG:4326', this._mapp.projection);
        }
        if (parameters.z) {
            this._mapp.zoom = Number(parameters.z);
        }
        if (parameters.r) {
            this._mapp.rotation = Number(parameters.r);
        }
        if (parameters.s) {
        }
    }
    createWidgets() {
        if (this._config.widgets.select) {
            this._widgets.select = new SelectClass(this._config.widgets.select, this._mapp);
        }
        if (this._config.widgets.editor && this._config.widgets.select) {
            this._widgets.editor = new EditorClass(this._config.widgets.editor, this._mapp, this._widgets.select);
        }
        if (this._config.widgets.search) {
            this._widgets.search = new SearchClass(this._config.widgets.search, this._mapp);
        }
        if (this._config.widgets.geocode) {
            this._widgets.geocode = new GeocodeClass(this._config.widgets.geocode);
        }
        if (this._config.widgets.attachments && this._config.widgets.select) {
            this._widgets.attachments = new AttachmentsClass(this._config.widgets.attachments, this._widgets.select);
        }
        if (this._config.widgets.measure) {
            this._widgets.measure = new MeasureClass(this._config.widgets.measure, this._mapp, null);
        }
        if (this._config.widgets.bookmarks) {
            this._widgets.bookmarks = new BookmarksClass(this._config.widgets.bookmarks, this._mapp);
        }
        if (this._config.widgets.profile) {
            this._widgets.profile = new ElevationProfileClass(this._config.widgets.profile, this._mapp);
        }
        if (this._config.widgets.info) {
            this._widgets.info = new InfoWindowClass(this._config.widgets.info, this._mapp);
        }
        if (this._config.widgets.userLocation) {
            this._widgets.userLocation = new UserLocationClass(this._config.widgets.userLocation, this._mapp);
        }
        if (this._config.widgets.mouseLocation) {
            this._widgets.mouseLocation = new MouseLocationClass(this._config.widgets.mouseLocation, this._mapp);
        }
        if (this._config.widgets.layerSwitcher) {
            this._widgets.layerSwitcher = new LayerSwitcherClass(this._config.widgets.layerSwitcher, this._mapp);
        }
        return this._widgets;
    }
    get helpers() { return Helpers; }
    get resources() { return Resources; }
    get config() { return this._config; }
    get mapp() { return this._mapp; }
    get widgets() { return this._widgets; }
    get geocode() { return this._widgets.geocode; }
    get attachments() { return this._widgets.attachments; }
    get measure() { return this._widgets.measure; }
    get bookrmaks() { return this._widgets.bookmarks; }
    get select() { return this._widgets.select; }
    get search() { return this._widgets.search; }
    get profile() { return this._widgets.profile; }
    get editor() { return this._widgets.editor; }
    get userLocationControl() { return this._widgets.userLocation; }
    get mouseLocationControl() { return this._widgets.mouseLocation; }
    get info() { return this._widgets.info; }
    get layerSwitcherControl() { return this._widgets.layerSwitcher; }
}

return UGisApp;

})));
