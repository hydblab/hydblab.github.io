(function() {
    function displaySearchResults(results, store) {
        var searchResults = document.getElementById('search-results');

        if (results.length) { // Are there any results?
            var appendString = '';

            for (var i = 0; i < results.length; i++) {  // Iterate over the results
                var item = store[results[i].ref];
                appendString += '<div><a href="' + item.url + '" class="catalogue-item"><h1 class="catalogue-title">' + (i+1) + '. ' + item.title + '</h1></a>';
                appendString += '<p>' + item.content.substring(0, 150) + '...</p></div>';
            }

            searchResults.innerHTML = appendString;
        } else {
            searchResults.innerHTML = '<li>검색 결과가 없습니다.</li>';
        }
    }

    function getQueryVariable(variable) {
        var query = window.location.search.substring(1);
        var vars = query.split('&');

        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split('=');

            if (pair[0] === variable) {
                return decodeURIComponent(pair[1].replace(/\+/g, '%20'));
            }
        }
    }

    function trimmerEnKo(token) {
        token.str = token.str
            .replace(/^[^\w가-힣]+/, '')
            .replace(/[^\w가-힣]+$/, '');
        return token
    };

    var searchTerm = getQueryVariable('query');

    if (searchTerm) {
        // Initalize lunr with the fields it will be searching on. I've given title
        // a boost of 10 to indicate matches on this field are more important.
        let idx = lunr(function () {
            this.pipeline.reset();
            this.pipeline.add(
               trimmerEnKo,
               lunr.stopWordFilter,
               lunr.stemmer
            );
            // this.use(trimmerEnKo);
            this.ref('id');
            this.field('title', { boost: 10 });
            this.field('author');
            this.field('category');
            this.field('content');
            this.field('id');
            Object.keys(window.store).forEach(function (k) {
                this.add(window.store[k])
            }, this)
        });

        var results = idx.search(searchTerm); // Get lunr to perform a search
        displaySearchResults(results, window.store); // We'll write this in the next section
    }
})();
