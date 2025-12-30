import axios from 'axios'


export const fetchDocuments = async (string: string) => {
    const link = `${import.meta.env.VITE_BACKEND}/google?query=${string}&numberOfResults=3&metrics=length,ranking,multimedia,links,perspicuity,language,keywords-position` 
    try {
        const { data } = await axios(link)
        return data
    } catch (error) {
        return error
    }
}