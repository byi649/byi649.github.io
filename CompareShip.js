/**
 * Created by Benjamin on 22/11/2017.
 * This js corresponds to CompareShip.html
 */


function getAverages(shipClass) {
    var totalFP = 0;
    var totalTP = 0;
    var totalHP = 0;
    var totalAA = 0;
    var count = 0;
    for (var i = 0; i < gameData.api_data.api_mst_ship.length; i++) {
        if (gameData.api_data.api_mst_ship[i].api_stype === shipClass && gameData.api_data.api_mst_ship[i].api_afterlv === 0) {
            totalFP += gameData.api_data.api_mst_ship[i].api_houg[1];
            totalTP += gameData.api_data.api_mst_ship[i].api_raig[1];
            totalHP += gameData.api_data.api_mst_ship[i].api_taik[0];
            totalAA += gameData.api_data.api_mst_ship[i].api_tyku[1];
            count++;
        }
    }
    var averageFP = totalFP / count;
    var averageTP = totalTP / count;
    var averageHP = totalHP / count;
    var averageAA = totalAA / count;
    var averageNB = (totalFP + totalTP) / count;
    return [averageFP, averageTP, averageHP, averageAA, averageNB];
}

function scaleStats(stats) {
    var scaled = [];
    for (i = 0; i < stats.ship.length; i++) {
        scaled[i] = stats.ship[i] / stats.average[i];
    }
    return scaled;
}

function extractData(name1, name2) {
  importShips();
  //TODO: error checking

    var ship1 = getShip("english", name1)
    var ship2 = getShip("english", name2)

    //TODO: scale this up to N comparisons
    $('#fp1').text(ship1.FP);
    $('#tp1').text(ship1.TP);
    $('#nB1').text(ship1.NB);
    $('#hp1').text(ship1.HP);
    $('#ar1').text(ship1.AR);
    $('#ev1').text(ship1.EV);
    $('#aa1').text(ship1.AA);
    $('#asw1').text(ship1.AS);
    $('#los1').text(ship1.LS);
    switch (ship1.RG) {
        case 1:
            $('#rg1').text('Short');
            break;
        case 2:
            $('#rg1').text('Medium');
            break;
        case 3:
            $('#rg1').text('Long');
            break;
        case 4:
            $('#rg1').text('Very Long');
            break;
    }
    $('#lk1').text(ship1.LK);

    $('#fp2').text(ship2.FP);
    $('#tp2').text(ship2.TP);
    $('#nB2').text(ship2.NB);
    $('#hp2').text(ship2.HP);
    $('#ar2').text(ship2.AR);
    $('#ev2').text(ship2.EV);
    $('#aa2').text(ship2.AA);
    $('#asw2').text(ship2.AS);
    $('#los2').text(ship2.LS);
    switch (ship2.RG) {
        case 1:
            $('#rg2').text('Short');
            break;
        case 2:
            $('#rg2').text('Medium');
            break;
        case 3:
            $('#rg2').text('Long');
            break;
        case 4:
            $('#rg2').text('Very Long');
            break;
    }
    $('#lk2').text(ship2.LK);

    //TODO: figure out what to do with two different classes
    var stats_scaling1 = {
        ship: [ship1.FP, ship1.TP, ship1.HP, ship1.AA, ship1.NB],
        average: getAverages(ship1.class)
    };

    var stats_scaling2 = {
      ship: [ship2.FP, ship2.TP, ship2.HP, ship2.AA, ship2.NB],
      average: getAverages(ship2.class)
    };

    //TODO: enlarge label size
    var data = {
        labels: ['FP', 'TP', 'HP', 'AA', 'NB'],
        datasets: [{
            label: name1,
            data: scaleStats(stats_scaling1),
            backgroundColor: 'rgba(66,134,244,0.3)',
            borderColor: 'rgba(66,134,244,1)'
        }, {
            label: name2,
            data: scaleStats(stats_scaling2),
            backgroundColor: 'rgba(26,191,59,0.3)',
            borderColor: 'rgba(26,191,59,1)'
        }, {
            label: 'Baseline',
            data: [1, 1, 1, 1, 1],
            backgroundColor: 'rgba(0,0,0,0)',
            borderColor: 'rgba(255,0,0,0.6)'
        }]
    };

    var radarChart = new Chart($("#radar"), {
        type: 'radar',
        data: data,
        options: {
            responsive: false,
            scale: {
                ticks: {
                    beginAtZero: true,
                    display: false,
                    max: 1.6
                }
            },
            legend: {
                display: true,
                position: 'right'
            }
        }
    });

}
