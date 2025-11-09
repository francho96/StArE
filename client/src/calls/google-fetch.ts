import axios from 'axios'


export const fetchDocuments = async (string: string) => {
    const link = `${import.meta.env.VITE_BACKEND}/google?q=${string}&p=0` 

    try {
        const { data } = await axios(link)
        return data
    } catch (error) {
        return error
    }
}