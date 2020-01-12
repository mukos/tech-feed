require('dotenv').config();

const NewsFeed = require('./modules/feed');
const App = require('./modules/app');

(
    async () => {
        try {
            await NewsFeed.startFeed();
            App.startServer();
        } catch (error) {
            console.error(error)
        }
    }
)();










