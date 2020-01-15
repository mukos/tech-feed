const readFolder = require('util').promisify(require('fs').readdir);
const jsonfile = require('jsonfile');
const uuid = require('uuid/v5');
const newsAPI = require('newsapi');

const { API_KEY, NAMESPACE } = process.env;

class NewsFeed {
    static articles = new Map();
    static favorites = new Map();

    static articlesPath = 'data';

    static news = new newsAPI(API_KEY);

    static interval = null;

    static sort = (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt);

    static getArticles(){
        return Array.from(this.articles.values()).sort( this.sort );
    }

    static getFavorites(){
        return Array.from(this.favorites.values()).sort( this.sort );
    }

    static async startFeed() {
        console.log('Starting feed...');
        try {
            const files = await readFolder(this.articlesPath);
            for( const fileName of files ){
                const [id, ext] = fileName.split('.');
                if( ext === 'json' ){
                    const article = await jsonfile.readFile(`${this.articlesPath}/${fileName}`);
                    this.articles.set(id, article);
                    if( article.favorite ) this.favorites.set(id, article);
                }
            }

            await this.saveArticles();
            this.interval = setInterval( () => this.saveArticles(),  60 * 1000 );
        } catch (error) {
            if(this.interval) clearInterval(this.interval);
            console.error(error);
        }
    };

    static async saveArticles() {
        console.log('Fetching articles...');
        const newContent = await this.news.v2.everything({ q: 'technology' });
        const { status, articles } = newContent;

        console.log(`Fetched ${articles.length} articles`);
        if( status !== 'ok' || articles.length < 1 ) return;

        for( const article of articles ){
            const id = uuid(article.title, NAMESPACE);
            if(!this.articles.has(id)){
                article.favorite = false;
                article.id = id;
                this.articles.set(id, article);
                await jsonfile.writeFile(`${this.articlesPath}/${id}.json`, article);
                console.log(`Saved article with id: ${id}`);
            }
        }
    };

    static async toggleFavorite(id) {
        if(!this.articles.has(id)) throw new Error('Article doesn\'t Exist');
        const article = this.articles.get(id);
        if(!this.favorites.has(id)){
            article.favorite = true;
            this.favorites.set(id, article);
            console.log(`Favorite article with id: ${id}`);
        } else {
            this.favorites.delete(id);
            article.favorite = false;
            console.log(`Unfavorite article with id: ${id}`);
        }
        await jsonfile.writeFile(`${this.articlesPath}/${id}.json`, article);
        return article.favorite;
    };
}

module.exports = NewsFeed;

