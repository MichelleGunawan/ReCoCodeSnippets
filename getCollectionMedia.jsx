import { useQuery } from "@tanstack/react-query";

//backend imports
import axios from "axios";
import { SERVER_IP } from "../../config/api";

const apiCall = async albumId => {
	console.log("usequery:", albumId);

	let response = await axios
		.get(`http://${SERVER_IP}/collection/collectionId/${albumId}/media`)
		.catch(error => {
			console.log("Get collection media failed:", error);
			alert("An error occurred. Please try again later.");
		});

	console.log("getMedia response:", response.data);

	return response.data;
};

export const getCollectionMedia = albumId => {
	return useQuery({
		queryKey: ["collection-media", albumId],
		queryFn: async () => apiCall(albumId),
	});
};
