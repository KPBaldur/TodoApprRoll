import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://todoapprroll.onrender.com";

const getAuthHeader = () => ({
    headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
});

export const getTasks = async () => {
    const res = await axios.get(`${API_URL}/tasks`, getAuthHeader());
    return res.data;
};

export const createTask = async (data: { title: string; description?: string; priority?: string; status?: string}) => {
    const res = await axios.post(`${API_URL}/tasks`, data, getAuthHeader());
    return res.data;
};

export const updateTask = async (id: string, data: Partial<{ title: string; description: string; priority: string; status: string }>) => {
  const res = await axios.put(`${API_URL}/tasks/${id}`, data, getAuthHeader());
  return res.data;
};

export const deleteTask = async (id: string) => {
  const res = await axios.delete(`${API_URL}/tasks/${id}`, getAuthHeader());
  return res.data;
};
