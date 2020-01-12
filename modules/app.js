const { PORT } = process.env;

const express = require('express');
const NewsFeed = require('./feed');

class App {
    static app = express();

    static startServer() {
        this.app.set('view engine', 'ejs');
        this.app.get( '/', this.renderHome );
        this.app.get( '/favorites', this.renderFavorites );
        this.app.get( '/toggle/:id', this.toggleFavorite );
        this.app.get( '*', this.notFound );
        this.app.use( this.error );

        this.app.listen( PORT, () => {
            console.log('Server listening on port', PORT );
        });
    }

    static renderHome(req, res){
        const data = NewsFeed.getArticles();
        console.log(`Rendering home page with ${data.length} articles`);
        res.render('index', { data, page: 'home' });
    }

    static renderFavorites(req, res){
        const data = NewsFeed.getFavorites();
        console.log(`Rendering favorites page with ${data.length} articles`);
        res.render('index', { data, page: 'favorites' });
    }

    static async toggleFavorite(req, res, next){
        const { id } = req.params;
        try {
            const favorite = await NewsFeed.toggleFavorite(id);
            res.status(200).send({ favorite });
        } catch (error) {
            next(error);
        }
    }

    static notFound(req, res, next){
        console.log(`Resource not found at ${req.url}`);
        res.sendStatus(404);
    }

    static error(error, req, res, next){
        console.error(error);
        res.sendStatus(500);
    }
}

module.exports = App;