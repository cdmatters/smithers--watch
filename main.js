"use strict";
var $container = document.getElementById('container')

var deck = Deck()
deck.mount($container)

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
            x:  Math.round((i - 2.05) * 70 * fontSize / 16),
            y:  Math.round(-110 * fontSize / 16),
        })
    }
    console.log(coords)
    return coords

}

function get_nsided_polygon_vertices(n, x_centre, y_centre, radius)
{ 
    let vertices = []
    let angle = 0
    let angle_increment =  Math.PI / (n - 1)
    for (let i = 0; i < n; i++)
    {
        vertices.push({
            x: x_centre + radius * Math.cos(angle),
            y: y_centre + radius * Math.sin(angle),
        })
        angle += angle_increment
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

function deal_hands(message)
{
    var coords = get_nsided_polygon_vertices(message.players.length, 0, 0, (window.innerHeight - 200)/2 )

    for (var i = 0; i < message.players.length; i++)
    {
        let hand_string =  message.players[i].hand.split("|")
        let cards = hand_string[1].split(" ")
        let dealer = hand_string[2]
        console.log(cards)
        move_cards_to_coord(cards, coords[i])
    }
}

// function allocate_seats()
// {
//     var coords = get_nsided_polygon_vertices(message.players.length, 0, 0, (window.innerHeight - 50)/2 )

// }

function allocate_seats(message)
{
    var coords = get_nsided_polygon_vertices(message.players.length, 0, 0, (window.innerHeight - 30)/2 )
    let players = {}
    for (let i = 0; i < message.players.length; i++ )
    {
         players[message.players[i].name] = {
            x: coords[i].x,
            y: coords[i].y,
            chips: message.players[i].chips,
            name: message.players[i].name,
            in_play: true
        }
    }
    return players
}


function deal_board(message)
{
    var coords = get_board_coords()
    console.log(coords)
    for (var i = 0; i < message.cards.length; i++)
    {
        move_cards_to_coord([message.cards[i]], coords[i])
    }  
}

var bubble = document.getElementById("bubble")
var timeout = false; 
function show_bubble(message, coord, type)
{
   bubble.innerHTML = message
   bubble.style.left = (coord.x || 50 ) + "px"
   bubble.style.top = (coord.y || 50 ) + "px"
   bubble.classList.add("show")
   clearTimeout(timeout)
   timeout = setTimeout(function() {
    bubble.classList.remove("show")
    bubble.style.left = 0 + "px"
    bubble.style.top = 0 + "px"
   }, 1000);

}

function draw_players(players)
{
    let container = document.getElementById("container");
    let p = ""
    for (p in players)
    {
        let p_div = document.createElement('div')
        container.appendChild(p_div)
        
        p_div.id = players[p].name
        p_div.className = "player"
        p_div.innerHTML = players[p].name + ":" + players[p].chips
        p_div.style.left = players[p].x + "px"
        p_div.style.top = players[p].y + "px"

    }

}

function process_file(json_tournament)
{
    var tournament_players = {}

    console.log(json_tournament)
    var i = 0 
    let id = setInterval(function(){
        let item = json_tournament[i]
        switch (item.type)
        {
        case "TOURNAMENT_START":
            tournament_players = allocate_seats(item)
            draw_players(tournament_players)
            break;
        case "DEALT_HANDS":
            deal_hands(item)
            break;
        case "DEALT_BOARD":
            console.log(item)
            deal_board(item)
            break;
        case "MOVE":
        case "BLIND":
            let chips = (item["move"] != "FOLD") ? item["bet"] : ""
            let message = item["name"] + " " + item["move"] + " " + chips
            show_bubble(message, {
                x:tournament_players[item["name"]].x,
                y:tournament_players[item["name"]].y
            })

            console.log(item)
            break;
        case "RESULTS":
            deck.flip()
            deck.flip()
            deck.sort(true)
            break
        default:
            console.log(item)

        }
        console.log(id)
        // if (i >= 30)
        if (i >= json_tournament.length)
        {
            clearInterval(id)
        }
        
        i++
        }, 1000) 



    
}

displayFile();


