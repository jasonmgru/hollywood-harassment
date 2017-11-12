
/* WEBSITE DATA */
const badWords = ["abuse", "nonconsensual", "rape", "assault", "grope", "misconduct",
"allegation", "groping", "harass", "non consen", "offender", 
"inappropriate", "child groom", "bestiality", "public indec"];

var accused = {};

/* HELPER FUNCTIONS */
 
function purifyNames(names){

    let helper = function(name){
        var purified = '';
        
        for(i=0; i<name.length; i++){
          if (name[i] === '('){
            if(name[i-1] === ' '){
              purified = purified.trim();
            }
            
            return purified;
          }
          
          purified = purified + name[i];
        }
    
        return purified;
    }
    
    var pure = [];
    $.each(names, function(i, el){
      pure.push(helper(el));
    });
    
    return pure;
}
function betterSplit(names){
    
    var nameList = [];
    var individual = '';

    for(i=0; i<names.length; i++){

        if(names[i] == ','){
            nameList.push(individual);
            individual = '';
        } else {
            individual = individual + names[i];
        }
    }
    
    nameList.push(individual);

    for(k=0; k<nameList.length; k++){
        nameList[k] = nameList[k].trim();
    }

    return nameList;
}
function dedupe(names){
    var uniqueNames = [];
    $.each(names, function(i, el){
        if($.inArray(el, uniqueNames) === -1) uniqueNames.push(el);
    });

    return uniqueNames;
}
function removeNA(names){
    return names.filter(function(word){
        return(word.toLowerCase() !== "n/a");
    });
}


/* API ACCESS */

function isAccused(articles, person){    

    var ret = false;

    for(i=0; i<articles.length; i++){
        var headline = articles[i].headline.main;

        for(k=0; k<badWords.length; k++){
            if(headline.toLowerCase().includes(badWords[k])){
                k = badWords.length;
                ret = true;

                //adds DOM node to accusedArticles
                var dest = articles[i].web_url;
                var $link = $('<a target=_blank href='+dest+'>'+headline+'</a>');
                if (accused[person] === undefined) accused[person] = [];
                accused[person].push($link);
            }
        }
    }

    return ret;
}

function updateDisplay() {
    var $disp = $('#display');
    var $p;
    var $label;

    $('.loader').hide();

    if($.isEmptyObject(accused)){
        $label = $('<label id="green">Good to Go!</label>');
    } else {
        $label = $('<label id="red">Accusations</label>');
    }
    $disp.append($label);

    console.log('accused: '+accused);

    $.each(accused, function(i, el){
        $label = $('<label>'+i+'</label>');
        $disp.append($label);

        for(k=0; k<el.length; k++){
            $p = $('<p></p>');
            $p.append(el[k]);
            $disp.append($p);            
        }
    });

    $disp.fadeIn(250);
}

function lookUp(people){

    if(people.length === 0) {
        updateDisplay();
        return;
    }

    var person = people[0];
    var query = 'headline:"'+person+'"';

    var place = "https://api.nytimes.com/svc/search/v2/articlesearch.json";
    place += '?' + $.param({
        'api-key': "4ea1957978af4a3d8fc042284cf13296",
        'fq': query
    });

    $.ajax({
        url: place,
        dataType: 'json',
        method: 'GET',
    }).done(function(result){

        var articles = result.response.docs;

        isAccused(articles, person);
        setTimeout(function(){ lookUp(people.slice(1)); }, 1000);

    }).fail(function(err){
        alert("ERROR retrieving data from New York Times (hint: don't press enter while search is running)");
    });
}

function getPeople(movie){
    
    console.log(movie);
    $.getJSON('https://www.omdbapi.com/?apikey=e3fb366f&t=' + encodeURI(movie)).then(function(response){
        
        if(response.Response === "False"){
            alert("Content Not Found");
        } else {
            var director = response.Director;
            var writer = response.Writer;
            var actors = response.Actors;
            console.log('director: '+director);
            console.log('writer: '+writer);
            console.log('actors: '+actors);

            var directorList = betterSplit(director);
            var writerList = betterSplit(writer);
            var actorList = betterSplit(actors);

            var people = directorList.concat(writerList.concat(actorList));
            people = dedupe(purifyNames(removeNA(people)));
            console.log('all people: '+people);

            lookUp(people);
        }

    });
}

/* EVENTS */

$(document).keypress(function(key){
    if(key.keyCode === 13){

        $('.loader').hide();        

        reset();
        createLoader();

        var input = document.getElementById('movieInput');
        getPeople(input.value);
    }
});

function reset(){
    accused = {};

    $('#display').fadeOut(0);
    $('#display').empty();
}

function createLoader(){
    var loader = $('<div class="loader"></div>');
    loader.fadeOut(0);
    $('body').append(loader);
    loader.fadeIn(500);
}