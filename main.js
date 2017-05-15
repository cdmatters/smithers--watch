"use strict";
var $container = document.getElementById('container')
$container.style.y = -200

var deck = Deck()
deck.mount($container)
// deck.translate(0,-100,0)
// con

function jsonToCard(smithers_card)
{ 
    var index = 0
    var card = smithers_card.split("")
    switch (card[0])
    {
    case "A":
        index = 0
        break
    case "T":
        index = 9
        break
    case "J":
        index = 10
        break
    case "Q":
        index = 11 
        break
    case "K":        
        index = 12
        break
    default:
        index = parseInt(card[0]) - 1
    }

    switch (card[1])
    {
    case "s":
        index += (13 * 0)
        break
    case "h":
        index += (13 * 1)
        break
    case "c":
        index += (13 * 2)
        break
    case "d": 
        index += (13 * 3)
        break
    }
    return deck.cards[index]
}

function displayFile()
{
    // load the JSON 
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() 
    {
        if (this.readyState == 4 && this.status == 200) 
        {
             process_file(JSON.parse(xhttp.response));
        }
    };
    xhttp.open("GET", "./tournaments.json", true);
    xhttp.send(); 
}

function get_board_coords()
{
    let coords = []
    let y = -230
    let span = 800
    let increment = span/5

    let fontSize = window.getComputedStyle(document.body).getPropertyValue('font-size').slice(0, -2)

    for (let i = 0; i < 5; i++)
    {
        coords.push({
            // from example
            x:  Math.round((i - 2.05) * 70 * fontSize / 16),
            y:  Math.round(-110 * fontSize / 16),
        })
    }
    console.log(coords)
    return coords

}

function get_nsided_polygon_vertices_ellipse(n, x_centre, y_centre, a, b, start_angle)
{
    function get_ellipse_radius(a, b, angle)
    {   
        return (a*b)/Math.sqrt(Math.pow(a*Math.sin(angle),2) + Math.pow(b*Math.cos(start_angle),2))
    }

    let vertices = []
    let angle_increment =  Math.PI / (n - 1)
    for (let i = 0; i < n; i++)
    {
        let radius = get_ellipse_radius(a, b, start_angle)
        vertices.push({
            x: x_centre + radius * Math.cos(start_angle),
            y: y_centre + radius * Math.sin(start_angle),
        })
        start_angle += angle_increment
    }
    return vertices
}

function move_cards_to_coord(cards, coord)
{
    cards.forEach(function (c, i) {
        var card = jsonToCard(c)

        var card_sep = 20
        card.setSide('front')
        card.animateTo({
            delay: 500 + i * 2, // wait 1 second + i * 2 ms
            duration: 500,
            ease: 'quartOut',
    
            x: coord.x + card_sep * i,
            y: coord.y + card_sep * i
        })

    })

}

function deal_hands(message, players)
{
    // var coords = get_nsided_polygon_vertices_ellipse(message.players.length, 0, 0, (window.innerWidth*.87)/2, (window.innerHeight*.87)/2, 0 )

    for (var i = 0; i < message.players.length; i++)
    {
        let player = document.getElementById(message.players[i].name)
        let hand_string =  message.players[i].hand.split("|")
        let cards = hand_string[1].split(" ")
        let dealer = hand_string[2]
        move_cards_to_coord(cards, players[message.players[i].name].coord)

        adjust_chips(message.players[i])
        adjust_bets(message.players[i])
        show_player_move(message.players[i], "")
    }
}

function clear_moves_if_not_folded(tournament_players)
{
    for (let name in tournament_players)
    {
        let player = document.getElementById(name)
        if (player.childNodes[3].innerHTML != "FOLD ")
        {
            player.childNodes[3].innerHTML = ""
        }
    }

}

function allocate_seats(message)
{
    var coords = get_nsided_polygon_vertices_ellipse(message.players.length, 0, 0, (window.innerWidth*.80)/2, (window.innerHeight*.90)/2, 0 )
    let players = {}
    for (let i = 0; i < message.players.length; i++ )
    {
         players[message.players[i].name] = {
            coord: {
                x: coords[i].x,
                y: coords[i].y,
            },
            chips: message.players[i].chips,
            name: message.players[i].name,
            text_coord: {
                x: (2*coords[i].x/(window.innerWidth*.8) > .9) ? coords[i].x - 120 : coords[i].x + 70,
                y: coords[i].y,
            },
            items : {},
            in_play: true
        }
    }
    return players
}


function deal_board(message)
{
    var coords = get_board_coords()
    for (var i = 0; i < message.cards.length; i++)
    {
        move_cards_to_coord([message.cards[i]], coords[i])
    }  
}

function adjust_bets(message)
{
    let player = document.getElementById(message["name"]);
    if (message["move"] != "FOLD")
    {
        let bet =  player.childNodes[1]
        bet.innerHTML = "BET: " + ( message.bet || "0" )
    }
}

function adjust_chips(message)
{
    let player = document.getElementById(message["name"]);
    let chips =  player.childNodes[2]
    chips.innerHTML = message["chips"] || 0

    let bet =  player.childNodes[1]
    bet.innerHTML = "BET: " + 0
    
}

var timeouts = {};
function show_player_move(message, move)
{
    let player = document.getElementById(message["name"])
    let move_div = player.childNodes[3]
    move_div.innerHTML = move
    move_div.classList.add("show")
    // move_div.style.opacity = 1

    clearTimeout(timeouts["name"])
    timeouts["name"] = setTimeout(function() {
    move_div.classList.remove("show")
    // move_div.style.opacity = 0 
   }, 750);

}

function show_winner(message)
{
    for (let i = 0; i < message.players.length; i++)
    {
        let winner = message.players[i]
        if (winner["winnings"] >= 0)
        {
            show_player_move(winner, "WIN: " + winner["winnings"])
        }
    }
}

function show_bust(message)
{
    for (let i = 0; i < message["names"].length ; i++)
    {
        let player = {
            "name":message["names"][i],
            "chips":0
        }
        show_player_move(player, "BUST")
        adjust_chips(player)
    }
}

function show_tournament_winner(message)
{

    let player = {
        "name":message["name"],
        "chips":message["winnings"]
    }
        show_player_move(player, "WINNER: " + message["winnings"])
        adjust_chips(player)
}

function draw_players(players)
{
    let container = document.getElementById("container");
    let p = ""
    for (p in players)
    {
        let player_div = document.createElement('div')

        let name_div = document.createElement('div')
        let chips_div = document.createElement('div')
        let bet_div = document.createElement('div')
        let move_div = document.createElement('div')

        player_div.appendChild(name_div)
        player_div.appendChild(bet_div)
        player_div.appendChild(chips_div)
        player_div.appendChild(move_div)
        container.appendChild(player_div)

        player_div.id = players[p].name
        player_div.className = "player"
        
        player_div.style.left = players[p].text_coord.x + "px"
        player_div.style.top = players[p].text_coord.y + "px"
        
        move_div.className = "move"
        move_div.innerHTML = "\n"


        name_div.className = "name"
        name_div.innerHTML = players[p].name 

        chips_div.className = "chips"
        chips_div.innerHTML = players[p].chips


        bet_div.className = "bet"
        bet_div.innerHTML = "BET: " + 0
    }

}

var pause = false;
function pause_play(){
    pause = !pause
    document.getElementById("pauseplay").innerHTML = (pause)?"PLAY":"PAUSE"
    console.log(pause)
}

function process_file(json_tournament)
{
    var tournament_players = {}

    console.log(json_tournament)
    var i = 0 
    let id = setInterval(function line(){
        let item = json_tournament[i]
        if (!pause)
        {
            console.log(i, item)
        }
        
        switch (pause || item.type)
        {
        case "TOURNAMENT_START":
            tournament_players = allocate_seats(item)
            draw_players(tournament_players)
            break;
        case "DEALT_HANDS":
            deal_hands(item, tournament_players)
            break;
        case "DEALT_BOARD":
            deal_board(item)
            clear_moves_if_not_folded(tournament_players)
            break;
        case "MOVE":
            let chips = (item["move"] != "FOLD") ? item["bet"] : ""
            let message = item["move"].split("_")[0] + " " + chips
            if (message == "CALL 0")
            {
                message = "CHECK"
            }
            adjust_bets(item)
            show_player_move(item, message)
            break;
        case "BLIND":
            let blind = "BLIND: " + item["bet"]
            adjust_bets(item)
            show_player_move(item, blind)
            break;
        case "BROKE":
            show_bust(item)
            break;
        case "WINNER":
            show_tournament_winner(item)
            break;
        case "RESULTS":
            show_winner(item)
            deck.flip()
            deck.flip()
            deck.sort(true)
            break;
        case "SHUTDOWN":
            break;
        case "MOVE_REQUEST":
            break;
        default:
            if (!pause)
            {
                console.log("case not covered")
            }
        }
        if (i >= json_tournament.length)
        {
            clearInterval(id)
        }
        
        if (!pause)
        {
            i++
        }

        }, 750) 



    
}

displayFile();


