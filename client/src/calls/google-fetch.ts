import axios from 'axios'


export const fetchDocuments = async (string: string) => {
    const link = `http://localhost:3000/google?q=${string}&p=0` 

    try {
        const { data } = await axios(link)
        return data
    } catch (error) {
        return error
    }
}