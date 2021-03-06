// Included in this file are functions intended to be useful for KC websites
// The main purpose of this is to call and parse KC data from both KC3kai and
// the game data itself.

// importShips() should be called before all else.
// getShip(id_type, ID) is useful for calling a specific ship


// Input files
var profileData;
$.getJSON("profile.json", function(json) {
  profileData = json;
});

var gameData;
$.getJSON("data.json", function(json) {
  gameData = json;
});


// Ship object definition
function Ship(rosterID, masterID, level, name, yomi, shipClass, slots, HP, FP, TP, AA, AR, EV, AS, LS, LK, RG) {

  // Unique ID, as shown by KC3 in shiplist
  this.rosterID = rosterID;

  // API ID, shared by duplicates (not the same as on wiki)
  this.masterID = masterID;

  // Kanji name, includes k(2)
  this.name = name;

  // Hiragana name, does not include k(2)
  this.yomi = yomi;

  // Remodel level of the ship
  // TODO: K2A handling for both cranes and AV. Suzuya/Kumano handling.
  this.remodel = function() {
    switch(this.name.slice(-1)) {
      case "二":
      return "Kai Ni";
      break;

      case "改":
      return "Kai";
      break;

      case "丁":
      return "Kai Ni D";
      break;

      case "甲":
      return "(Kai Ni) A";
      break;

      case "母":
      return "Kai Bo";
      break;

      default:
      return "";
    }
  }

  this.english = function() {
    var englishName = wanakana.isJapanese(this.name) ? wanakana.toRomaji(this.yomi) : this.name.replace(/改|二/g, "");
    englishName = englishName + " " + this.remodel();
    return englishName;
  };

  // Ship classification
  this.class = shipClass;

  // Plane slots array, with zero slots removed
  this.slots = slots.filter(Number);

  // Ship current stats, not including equips
  this.level = level;
  this.HP = HP;
  this.FP = FP;
  this.TP = TP;
  this.AA = AA;
  this.AR = AR;
  this.EV = EV[0];
  this.AS = AS;
  this.LS = LS[0];
  this.LK = LK[0];
  this.RG = RG;

  // Night battle stats
  this.NB = (this.class == 7 | this.class == 11 | this.class == 18) ? 0 : this.FP + this.TP;
  this.NBCI = this.LK > 30 ? this.NB * 1.3 : this.NB;

  // Air power
  // Currently only gives AP for CV(L/B)
  // TODO: figure out what to do for CAV, AV, LHA, etc
  this.fighter = function() {
    var fighter_power = 0;
    // Intentionally do not count first slot - use for torpedo bomber or something
    // Assuming reppuu in all other slots
    for (var i = 1; i < this.slots.length; i++) {
        fighter_power += Math.floor(Math.sqrt(this.slots[i]) * 10 + 25);
    }
    return (this.class == 7 | this.class == 11 | this.class == 18) ? fighter_power : 0;
  }

}

// This needs to be called each session
// It transforms raw data into a readable array
var profileShips = [];

function importShips () {

  var i = 0;
  for (var ship in profileData.ships) {

    // Find corresponding ship in game data
    var index = -1;
    for (var j = 0; j < gameData.api_data.api_mst_ship.length; j++) {
      if (profileData.ships[ship].masterId == gameData.api_data.api_mst_ship[j].api_id) {
        index = j;
      }
    }

    // Get true ASW
    // Take profile data asw, then subtract all equipment
    var asw = profileData.ships[ship].as[0];
    for (var k = 0; k < profileData.ships[ship].items.length; k++) {
      if (profileData.ships[ship].items[k] < 0) {continue;} // No item
      for (var l = 0; l < gameData.api_data.api_mst_slotitem.length; l++) {
        // Search for item in game data, using corresponding item api_id
        if (profileData.gears["x" + profileData.ships[ship].items[k]].masterId === gameData.api_data.api_mst_slotitem[l].api_id) {
          asw -= gameData.api_data.api_mst_slotitem[l].api_tais; // Subtract equip asw
        }
      }
    }

    profileShips[i] = new Ship(
      profileData.ships[ship].rosterId,
      profileData.ships[ship].masterId,
      profileData.ships[ship].level,
      gameData.api_data.api_mst_ship[index].api_name,
      gameData.api_data.api_mst_ship[index].api_yomi,
      gameData.api_data.api_mst_ship[index].api_stype,
      profileData.ships[ship].slots,
      gameData.api_data.api_mst_ship[index].api_taik[0],
      gameData.api_data.api_mst_ship[index].api_houg[0] + profileData.ships[ship].mod[0],
      gameData.api_data.api_mst_ship[index].api_raig[0] + profileData.ships[ship].mod[1],
      gameData.api_data.api_mst_ship[index].api_tyku[0] + profileData.ships[ship].mod[2],
      gameData.api_data.api_mst_ship[index].api_souk[0] + profileData.ships[ship].mod[3],
      profileData.ships[ship].ev,
      asw,
      profileData.ships[ship].ls,
      profileData.ships[ship].lk,
      profileData.ships[ship].range
    );

    i++;
  }
}

// Returns the ship object, given some sort of ID
function getShip(id_type, ID) {
  switch(id_type) {

    case "xID":
    for (var i = 0; i < profileShips.length; i++) {
      if (profileShips[i].rosterID == ID) return profileShips[i];
    }
    break;

    case "apiID":
    for (var i = 0; i < profileShips.length; i++) {
      if (profileShips[i].masterID == ID) return profileShips[i];
    }
    break;

    case "yomi":
    for (var i = 0; i < profileShips.length; i++) {
      if (profileShips[i].yomi == ID) return profileShips[i];
    }

    case "kanji":
    for (var i = 0; i < profileShips.length; i++) {
      if (profileShips[i].name == ID) return profileShips[i];
    }

    case "english":
    var hiraganaName = wanakana.toHiragana(ID);
    for (var i = 0; i < profileShips.length; i++) {
      if (profileShips[i].yomi == hiraganaName) return profileShips[i];
    }

    //TODO: smart name selection
    default:
    return null;
  }
}
