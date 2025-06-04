import { Client } from '@notionhq/client';

// Test the new token directly
const newToken = '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';

async function testToken() {
    const notion = new Client({
        auth: newToken,
    });

    try {
        const user = await notion.users.me();
        console.log('Token works! User:', user.name);
        return true;
    } catch (error) {
        console.log('Token failed:', error.message);
        return false;
    }
}

testToken();