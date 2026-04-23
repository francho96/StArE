import stare from './lib/index';
import './lib/config/defaultOptions';

async function test() {
    const instance = stare({
        engines: ['google'],
        enableMultiCore: false
    });

    if (!instance) {
        console.error('Failed to create stare instance');
        return;
    }

    try {
        const result = await instance.search('google', 'hola', 10, ['ranking']);
        console.log(JSON.stringify(result, null, 2));
    } catch (err) {
        console.error('Error during search:', err);
    }
}

test();
