import React, {
	useState,
	useEffect,
	useCallback,
	useContext,
	useRef,
	useMemo,
} from "react";
import {
	View,
	Image,
	Modal,
	StyleSheet,
	TouchableOpacity,
	Text,
	TouchableWithoutFeedback,
	Dimensions,
	FlatList,
} from "react-native";
import { Entypo } from "@expo/vector-icons";
import AutoLink from "react-native-autolink";

import MediaOptionsModal from "../../wrappers/modal/MediaOptionModal";
import SelectCollectionModal from "../../wrappers/modal/SelectCollectionModal";
import CommentModal from "../../wrappers/modal/CommentModal";
import ProfileListModal from "../../wrappers/modal/ProfileListModal";

import axios from "axios";
import { SERVER_IP } from "../../config/api";

import WebView from "react-native-webview";
import CachedImage from "expo-cached-image";
import ExpandableText from "../../components/TextField/ExpendableText";
import InputBoxMultiline from "../../components/TextField/InputBoxMultiline";

import { Like } from "../../components/Buttons/Like";
import { Comment } from "../../components/Buttons/Comment";
import { Send } from "../../components/Buttons/Send";
import { Save } from "../../components/Buttons/Save";
import { Edit } from "../../components/Buttons/Edit";

import { useSelector, useDispatch } from "react-redux";
import GlobalStyle from "../../GlobalStyles";

import MediaView from "../../components/LinkViews/MediaView";
import { set } from "react-native-reanimated";

const { width, height } = Dimensions.get("window");
const imageWidth = width - 16;
const imageHeight = height - 80 - 100;

const ITEM_HEIGHT = height - 80;
export default function ImageViewScreen({
	navigation,
	photo,
	photos,
	setImageView,
	setSelected, //selected image for save
	setLikeModalVisible,
}) {
	const dispatch = useDispatch();
	const colors = useSelector(state => state.colorScheme.colorScheme);
	const user = useSelector(state => state.user.user);
	const collection = useSelector(state => state.collection.collection);
	const [cover, setCover] = useState(true);
	const [editMode, setEditMode] = useState(false);
	const [caption, setCaption] = useState("");
	const [mediaList, setMediaList] = useState([]);

	const [mediaIndex, setMediaIndex] = useState(0);
	const [media, setMedia] = useState({});
	const [mediaLikes, setMediaLikes] = useState([]);

	// For option modal
	const optionModalRef = useRef(null);
	const handleOptionModalPress = useCallback(item => {
		setCaption(item.caption);
		setMediaList([item._id]);
		optionModalRef.current?.present();
	}, []);

	// For collection modal
	const collectionModalRef = useRef(null);
	const handleCollectionModalPress = useCallback(itemId => {
		console.log("itemId:", [itemId]);
		setMediaList([itemId]);
		collectionModalRef.current?.present();
	}, []);

	// For likes modal
	const likesModalRef = useRef(null);
	const handleLikesModalPress = useCallback(
		async index => {
			setMediaLikes(collection.photos[index].userLikes);
			likesModalRef.current?.present();
		},
		[collection.photos],
	);

	//For comment modal
	const mediaCommentModalRef = useRef(null);
	const handleMediaCommentModalPress = useCallback(
		(index, media) => {
			setMediaIndex(index);
			setMedia(media);
			mediaCommentModalRef.current?.present();
		},
		[collection.photos],
	);

	const renderItem = ({ item, index }) => {
		console.log("item:", item);
		if (item) {
			return (
				<View style={{ height: height - 80 }}>
					<TouchableOpacity
						onPress={() => {
							setImageView(false);
						}}
						style={{
							width: "100%",
							height: "100%",
							backgroundColor: "grey",
							opacity: 0.5,
							zIndex: 1,
							elevation: 1,
						}}
					/>
					<View
						style={{
							position: "absolute",
							alignSelf: "center",
							overflow: "hidden",
							top: 75,
							width: width - 16,
							height: height - 90 - 100,
							borderRadius: 16,
							backgroundColor: colors.background,
							elevation: 5,
							zIndex: 5,
						}}
					>
						<View
							style={{
								flex: 1,
								backgroundColor: colors.input,
								borderBottomColor: GlobalStyle.colorSet.greylight,
								borderBottomWidth: StyleSheet.hairlineWidth,
							}}
						>
							<View style={styles.image}>
								<MediaView
									thumbnail={false}
									_id={item._id}
									mediaType={item.mediaType}
									source={item.source}
								/>
							</View>
						</View>
						<View
							style={{
								flex: 1,
								width: "100%",
								height: editMode ? "50%" : null,
								position: "absolute",
								bottom: 0,
								backgroundColor: colors.background,
								paddingHorizontal: 16,
								paddingVertical: 16,
							}}
						>
							<View
								style={{
									flexDirection: "row",
									justifyContent: "space-between",
									marginBottom: 8,
								}}
							>
								<View style={{ flexDirection: "row" }}>
									<View style={{ marginRight: 24 }}>
										<Like
											liked={item.userLikes.some(like => like._id == user._id)}
											likeCount={item.userLikes.length}
											direction={"row"}
											size={24}
											addLike={async () => {
												console.log("add like:", item);
												try {
													let data = await axios.post(
														`http://${SERVER_IP}/media/mediaId/${item._id}/like`,
													);
													console.log("add like:", data);
													//setLikeCount(likeCount + 1);
													dispatch({
														type: "ADD_PHOTO_LIKE",
														payload: {
															photoId: item._id,
															user: {
																_id: user._id,
																username: user.username,
																profilePhoto: user.profilePhoto,
															},
														},
													});
												} catch (err) {
													console.log(err);
												}
											}}
											removeLike={async () => {
												console.log("remove like:", item);
												try {
													let data = await axios.delete(
														`http://${SERVER_IP}/media/mediaId/${item._id}/like`,
													);
													console.log("removed like:", data);
													//setLikeCount(likeCount - 1);
													dispatch({
														type: "REMOVE_PHOTO_LIKE",
														payload: { photoId: item._id, userId: user._id },
													});
												} catch (err) {
													console.log(err);
												}
											}}
											onLongPress={() => {
												handleLikesModalPress(index);
											}}
										/>
									</View>

									<Comment
										commentCount={item?.comments?.length ?? 0}
										onPress={() =>
											handleMediaCommentModalPress(index, {
												_id: item._id,
												mediaType: item.mediaType,
												source: item.source,
											})
										}
									/>
								</View>
								<View style={{ flexDirection: "row" }}>
									<View style={{ marginRight: 24 }}>
										<Send />
									</View>
									<TouchableOpacity
										onPress={() => handleCollectionModalPress(item._id)}
									>
										<Save />
									</TouchableOpacity>
								</View>
							</View>

							{!editMode && (
								<TouchableOpacity
									onPress={() => {
										setSelected([item]);
										handleMediaCommentModalPress(index, {
											_id: item._id,
											mediaType: item.mediaType,
											source: item.source,
										});
									}}
								>
									<AutoLink
										text={item.caption}
										style={{ color: colors.text }}
										numberOfLines={2}
									/>
								</TouchableOpacity>
								// <ExpandableText
								// 	text={item.caption}
								// 	maxLines={50}
								// 	onExpandedPress={() => {
								// 		setSelected([item]);
								// 		handleMediaCommentModalPress();
								// 	}}
								// />
							)}
							{editMode && (
								<InputBoxMultiline
									text={caption}
									onChangeText={setCaption}
									label={"Add a caption..."}
								/>
							)}

							<View
								style={{
									flexDirection: "row",
									justifyContent: "space-between",
								}}
							>
								<Text
									style={{
										fontSize: 16,
										color: "grey",
										fontWeight: "200",
										marginTop: 16,
									}}
									onPress={() => {
										setSelected([]);
										navigation.navigate("User Profile Screen", {
											userId: item.ownerId,
										});
									}}
								>
									@ {item.ownerUsername ?? "username"}
								</Text>
								{item.ownerId == user._id &&
									(!editMode ? (
										<Entypo
											onPress={() => {
												handleOptionModalPress(item);
											}}
											name="dots-three-horizontal"
											size={22}
											color={colors.primary}
											style={{ alignSelf: "flex-end" }}
										/>
									) : (
										<View style={{ flexDirection: "row" }}>
											<Text
												style={{
													fontSize: 16,
													color: colors.primary,
													marginTop: 16,
													marginRight: 8,
												}}
												onPress={() => {
													setEditMode(!editMode);
												}}
											>
												Cancel
											</Text>
											<Text
												style={{
													fontSize: 16,
													color: colors.primary,
													marginTop: 16,
												}}
												onPress={async () => {
													setEditMode(!editMode);
													await axios.put(
														`http://${SERVER_IP}/media/mediaId/${item._id}/caption`,
														{ caption: caption },
													);
													dispatch({
														type: "SET_MEDIA_CAPTION",
														payload: { mediaId: item._id, caption: caption },
													});
												}}
											>
												Done
											</Text>
										</View>
									))}
							</View>
						</View>
					</View>
					<MediaOptionsModal
						bottomSheetModalRef={optionModalRef}
						onEditPressed={() => {
							setEditMode(true);
							optionModalRef.current.close();
						}}
						onDeletePressed={async () => {
							await axios
								.post(`http://${SERVER_IP}/collection/removeMedia`, {
									mediaList: mediaList,
								})
								.then(res => {
									dispatch({ type: "REMOVE_MEDIA", payload: item._id });
								});
							optionModalRef.current.close();
						}}
					/>
					<SelectCollectionModal
						navigation={navigation}
						bottomSheetModalRef={collectionModalRef}
						canClose={true}
						selectedPhotos={mediaList}
						onClose={() => {
							setMediaList([]);
						}}
					/>
					<ProfileListModal
						navigation={navigation}
						bottomSheetModalRef={likesModalRef}
						title="Likes"
						data={mediaLikes}
					/>

					<CommentModal
						navigation={navigation}
						bottomSheetModalRef={mediaCommentModalRef}
						title="Media Comments"
						comments={collection.photos[mediaIndex].comments}
						onPost={async comment => {
							console.log("comment2:", comment, media);

							try {
								await axios.post(
									`http://${SERVER_IP}/comment/media/${media._id}`,
									{
										comment: comment,
									},
								);

								const newComment = {
									collectionId: collection._id,
									profilePhoto: user.profilePhoto,
									username: user.username,
									userId: user._id ?? "username", //userId undefined
									comment: comment,
									mediaId: media,
								};
								dispatch({ type: "ADD_MEDIA_COMMENT", payload: newComment });
								dispatch({ type: "ADD_COMMENT", payload: newComment });
							} catch (err) {
								console.log("error:", err);
							}
							return;
						}}
					/>
				</View>
			);
		}
		return;
	};

	return (
		<View style={{ flex: 1, top: 0 }}>
			<FlatList
				data={photos}
				renderItem={renderItem}
				horizontal={false}
				pagingEnabled
				showsVerticalScrollIndicator={false}
				initialScrollIndex={photos.findIndex(item => item._id === photo._id)}
				getItemLayout={(data, index) => ({
					length: ITEM_HEIGHT, // specify the height of each item
					offset: ITEM_HEIGHT * index,
					index,
				})}
			/>

			{/* Your additional components (like buttons) can be placed here */}
		</View>
	);
}

const styles = StyleSheet.create({
	image: {
		resizeMode: "cover",
		width: "100%",
		height: height - 80 - 100 - 120,
		borderTopLeftRadius: 16,
		borderTopRightRadius: 16,
	},
});
