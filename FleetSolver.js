/**
* Created by Benjamin on 22/11/2017.
*/

// Grey out 0/6
// TODO: implement proper ghost text
$(document).ready(function () {
  $('#allmodels').on('change', function() {
    $('.min').filter(function() {
      return Number($(this).val()) === 0;
    }).css({color: "#D3D3D3"});
    $('.min').filter(function() {
      return !(Number($(this).val()) === 0);
    }).css({color: "#000000"});
    $('.max').filter(function() {
      return Number($(this).val()) === 6;
    }).css({color: "#D3D3D3"});
    $('.max').filter(function() {
      return !(Number($(this).val()) === 6);
    }).css({color: "#000000"});
  })
});

// Reset button
// TODO: implement proper ghost text
function reset_form() {
  $(".constraints")[0].reset();
  $(".constraints .min, .constraints .max").css({color: "#D3D3D3"});
  $('#right').css({visibility: "hidden"});
  $('#showFeasible').text("");
}

var numFleet = 1;

$(document).ready(function () {

  var subpage = $('#Fleet1')[0].innerHTML;


  // Add fleet button
  $('#addFleet').click(function () {
    // Update sidebar and numFleet
    var sidebar_list = $('#sidebarItems')[0].innerHTML;
    numFleet++;
    var new_list_item = document.createElement("LI");
    new_list_item.setAttribute("id", "Select fleet " + numFleet + " sidebar");
    new_list_item.innerHTML = "Fleet " + numFleet;
    $('#sidebarItems')[0].appendChild(new_list_item);
    // Generate new fleet page
    var new_page = document.createElement("DIV");
    new_page.id = "Fleet" + numFleet;
    new_page.className = "inputform";
    new_page.innerHTML = subpage.replace(/1/g, numFleet);
    new_page.style.display = "none";
    $('#allmodels')[0].appendChild(new_page);
  });

  // Fleet buttons
  $("#sidebarItems").on('click', "[id^='Select fleet']", function(){
    // Hide all
    $("[id^='Fleet']").css( "display", "none" );
    $("[id^='Select']").each(function() {
      $(this).attr('class', '')
    });
    // Show clicked
    var fleetID = $(this)[0].innerHTML.slice(-1);
    $("[id='Fleet" + fleetID + "']").css( "display", "" );
    $("[id='Select fleet " + fleetID + " sidebar']")[0].className = "active";
  });

});

// These are analogous to columns of the A matrix
// We define the decision variable and its contribution to the constraints
function generate_decision_variables(obj, numFleet) {
  // Here we store the contribution to constraints
  // We have one entry for each ship + fleet combination
  var decisionShips = {};
  for (var ship in profileShips) {
    for (var l = 0; l < numFleet; l++) {
      decisionShips[l + "+" + profileShips[ship].rosterID] = {};
    }
  }

  for (var ship in profileShips) {
    for (var i = 0; i < numFleet; i++) {
      // Ship count for fleet
      decisionShips[i + "+" + profileShips[ship].rosterID][i + "maxShips"] = 1;
      // Minimum fighter power
      decisionShips[i + "+" + profileShips[ship].rosterID][i + "AP"] = profileShips[ship].fighter();
      // OASW count
      // TODO: user input for minimum asw
      decisionShips[i + "+" + profileShips[ship].rosterID][i + "OASW"] = (profileShips[ship].AS >= 70) ? 1 : 0;
      // AACI count
      // TODO: smarter way to ignore BB
      decisionShips[i + "+" + profileShips[ship].rosterID][i + "AACI"] = (profileShips[ship].AA >= 100 && profileShips[ship].class !== 8) ? 1 : 0;
      // Contribution to objective function
      decisionShips[i + "+" + profileShips[ship].rosterID]["obj"] = profileShips[ship][obj[i]];
      // Class restrictions
      decisionShips[i + "+" + profileShips[ship].rosterID][i + "Class #" + profileShips[ship].class] = 1;
      // Non-duplicate ship
      decisionShips[i + "+" + profileShips[ship].rosterID][profileShips[ship].yomi] = 1;
    }
  }

  return decisionShips;

}

// Assume maxShips = [maxShips1, maxShips2 ...] and so on
// Assume minClass = [ [0,0, ...], [0,0, ...], ... ] and so on
function create_constraints_multiple(maxShips, minFighter, minOASW, minAACI, minClass, maxClass, numFleet) {
  var constraints = {};
  for (var i = 0; i < numFleet; i++) {
    constraints[i + "maxShips"] = {
      "max": maxShips[i]
    };
    constraints[i + "OASW"] = {
      "min": minOASW[i]
    };
    constraints[i + "AP"] = {
      "min": minFighter[i]
    };
    constraints[i + "AACI"] = {
      "min": minAACI[i]
    };

    for (var j = 1; j <= 22; j++) {
      constraints[i + "Class #" + j] = {
        "min": minClass[i][j-1],
        "max": maxClass[i][j-1]
      };
    }
  }

  // Non-duplicate ship constraints
  // One for each ship name
  for (var ship in profileShips) {
    constraints[profileShips[ship].yomi] = {
      "max": 1
    };
  }

  return constraints;
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Here we go!
function solve_model() {
  importShips();
  var obj = [];
  var maxShips = [];
  var minFighter = [];
  var minOASW = [];
  var minAACI = [];
  var minClass = new Array(numFleet);
  var maxClass = new Array(numFleet);
  for (var fleetN = 0; fleetN < numFleet; fleetN ++) {
    minClass[fleetN] = [];
    maxClass[fleetN] = [];
  }

  for (var fleet = 1; fleet <= numFleet; fleet++) {
    var minarrayIndex = 0;
    var maxarrayIndex = 0;
    obj[fleet-1] = $("[name= objective" + fleet + "]").val();
    maxShips[fleet-1] = $("[name= maxShips" + fleet + "]").val();
    minFighter[fleet-1] = $("[name= minFighter" + fleet + "]").val();
    minOASW[fleet-1] = $("[name= minOASW" + fleet + "]").val();
    minAACI[fleet-1] = $("[name= minAACI" + fleet + "]").val();

    minClass[fleet-1] = new Array(22).fill(0);
    $(".min").each(function(index) {
      var selected = $(this);
      if (Number($(this)[0].name.slice(-1)) === fleet) {
        minClass[fleet-1][minarrayIndex] = selected.val();
        minarrayIndex++;
      }
    });

    maxClass[fleet-1] = new Array(22).fill(6);
    $(".max").each(function(index) {
      var selected = $(this);
      if (Number($(this)[0].name.slice(-1)) === fleet) {
        maxClass[fleet-1][maxarrayIndex] = selected.val();
        maxarrayIndex++;
      }
    });
  }

  var model = {
    "optimize": "obj",
    "opType": "max",
    "constraints": create_constraints_multiple(maxShips, minFighter, minOASW, minAACI, minClass, maxClass, numFleet),
    "variables": generate_decision_variables(obj, numFleet),
    "ints": {},
    "tolerance": 20 // Because fuck CV
  };

  for (var i = 0; i < numFleet; i++) {
    for (var ship in profileShips) {
      model.ints[i + profileShips[ship].rosterID] = 1;
    }
  }

  results = solver.Solve(model);
  // alert(Object.keys(results));

  // Translate results
  var list_of_ships = new Array(numFleet);

  for (fleetN = 0; fleetN < numFleet; fleetN++) {
    list_of_ships[fleetN] = [];
  }

  for (var k = 0; k < numFleet; k++) {
    var j = 0;
    for (var prop in results) {
      if (!(prop === 'feasible' || prop === 'result' || prop === 'bounded' || results[prop] === 0)) {
        if (Number(prop.charAt(0)) === k) {
          list_of_ships[k][j] = capitalizeFirstLetter(getShip("xID", prop.slice(2)).english());
          j++;
        }
      }
    }
  }

  // Display results
  if (results.feasible === false) {
    $('#showFeasible').text("Constraints are infeasible");
    $('#right').css({visibility: "hidden"});
    return;
  }
  var table = "";
  for (k = 0; k < numFleet; k++) {
    table += "Fleet " + (k + 1) + " - " + obj[k] + "<table>";
    for (i = 0; i < list_of_ships[k].length; i++) {
      table += "<tr><td> Ship " + (i + 1) + "</td><td>" + list_of_ships[k][i] + "</td></tr>";
    }
    table += "</table> <br>";
  }

  $('#solution').html(table);
  $('#showFeasible').text("");
  $('#right').css({visibility: "visible"})
}
