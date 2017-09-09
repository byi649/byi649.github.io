/**
 * Created by Benjamin on 12/06/2017.
 * This js is used to import both game data and profile data
 */

var profileData;
$.getJSON("profile.json", function(json) {
    profileData = json;
});

var gameData;
$.getJSON("dataShips.json", function(json) {
    gameData = json;
});

var equipData;
$.getJSON("equipData.json", function(json) {
    equipData = json;
});

function loadData() {
  var jsonData = $('#profileInputBox').val();
  profileData = $.parseJSON(jsonData);

}

function clean_game_Data() {
    var arrayEnd = gameData.length;
    for (var i = 0; i < arrayEnd; i++) {
        if (gameData[i].api_id >= 1000) {
            gameData.splice(i, 1);
            i--;
            arrayEnd--;
        }
    }
}

// Returns [xID, index of ship on profileData]
function convert_api_ID_to_rosterX_ID(api_id) {
    var counter = 0;
    for (var prop in profileData.ships) {
        if (profileData.ships[prop].masterId === api_id) {
            return [prop, counter];
        }
        counter++;
    }
    return -1;
}

// Returns [api id, index of ship on gameData]
function convert_rosterX_ID_to_api_ID(rosterX_id) {
    for (var i = 0; i < gameData.length; i++) {
        if (profileData.ships[rosterX_id].masterId === gameData[i].api_id) {
            return [gameData[i].api_id, i];
        }
    }
}

function convert_name_to_api_ID(name) {
    for (var i = 0; i < gameData.length; i++) {
        if (gameData[i].api_name === name) {
            return [gameData[i].api_id, i];
        }
    }
}

function convert_api_ID_to_name(api_ID) {
    for (var i = 0; i < gameData.length; i++) {
        if (gameData[i].api_id === api_ID) {
            return [gameData[i].api_name, i];
        }
    }
}

function convert_api_ID_to_yomi(api_ID) {
    for (var i = 0; i < gameData.length; i++) {
        if (gameData[i].api_id === api_ID) {
            return [gameData[i].api_yomi, i];
        }
    }
}

function convert_rosterX_ID_to_yomi(rosterX_id) {
    for (var i = 0; i < gameData.length; i++) {
        if (profileData.ships[rosterX_id].masterId === gameData[i].api_id) {
            return gameData[i].api_yomi;
        }
    }
}

function get_ship_data(api_id) {
    var index;
    for (var i = 0; i < gameData.length; i++) {
        if (gameData[i].api_id === api_id) {
            index = i;
        }
    }
    var rosterX_ID = convert_api_ID_to_rosterX_ID(api_id)[0];

    var fp = gameData[index].api_houg[1];
    var tp = gameData[index].api_raig[1];
    var nB = gameData[index].api_houg[1] + gameData[index].api_raig[1];
    var hp = gameData[index].api_taik[0];
    var ar = gameData[index].api_souk[1];
    var ev = profileData.ships[rosterX_ID].ev[0];
    var aa = gameData[index].api_tyku[1];
    var asw = profileData.ships[rosterX_ID].as[0];
    var los = profileData.ships[rosterX_ID].ls[0];
    var rg = profileData.ships[rosterX_ID].range;
    var lk = profileData.ships[rosterX_ID].lk[0];
    var shipClass = gameData[index].api_stype;

    var array = [fp, tp, nB, hp, ar, ev, aa, asw, los, rg, lk, shipClass];
    return array;
}

function get_ship_ASW(rosterX_ID) {
    var asw = profileData.ships[rosterX_ID].as[0];
    for (i = 0; i < profileData.ships[rosterX_ID].items.length; i++) {
        if (profileData.ships[rosterX_ID].items[i] < 0) {continue;}
        for (j = 0; j < equipData.length; j++) {
            if (profileData.gears["x" + profileData.ships[rosterX_ID].items[i]].masterId === equipData[j].api_id) {
                asw -= equipData[j].api_tais;
            }
        }
    }
    return asw;
}
