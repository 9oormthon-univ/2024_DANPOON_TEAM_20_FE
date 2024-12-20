import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useFocusEffect} from '@react-navigation/native';
import NavBar from '../components/navBar';
import Header from '../components/header';

const {width, height} = Dimensions.get('window');

// 날짜 형식 함수
const formatDate = dateString => {
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  hours = hours ? String(hours).padStart(2, '0') : '12';

  return `${month}월 ${day}일 ${hours}:${minutes}${ampm}`;
};

const MainSocial = ({navigation, route}) => {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]); // 필터링된 게시글 상태
  const [activeTags, setActiveTags] = useState([]);
  const hashtags = ['#음식', '#K-POP', '#핫플', '#질문', '#구인'];

  useEffect(() => {
    if (route.params?.newPost) {
      setPosts(prevPosts => [route.params.newPost, ...prevPosts]);
    }
  }, [route.params?.newPost]);

  useEffect(() => {
    const fetchPosts = async () => {
      const accessToken = await AsyncStorage.getItem('accessToken');

      try {
        const response = await fetch(
          'https://mixmix2.store/api/feed/all?keyword=SOCIAL&nationality=kr&page=0&size=10',
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          const feedDataWithProfiles = data.data.feedListResDto.map(feed => ({
            ...feed,
            memberImage: feed.memberImage || 'https://via.placeholder.com/40',
            memberName: feed.memberName || '익명',
          }));
          setPosts(feedDataWithProfiles || []);
          setFilteredPosts(feedDataWithProfiles || []); // 초기값 설정
        } else {
          console.error('API 호출 실패:', response.status);
        }
      } catch (error) {
        console.error('네트워크 오류:', error);
      }
    };

    fetchPosts();
  }, []);

  // 해시태그 버튼 클릭 시 태그 활성화/비활성화
  const toggleTag = tag => {
    setActiveTags(prevTags =>
      prevTags.includes(tag)
        ? prevTags.filter(activeTag => activeTag !== tag)
        : [...prevTags, tag],
    );
  };

  // activeTags 상태가 변경될 때 게시글 필터링
  useEffect(() => {
    if (activeTags.length === 0) {
      setFilteredPosts(posts); // 선택된 태그가 없으면 전체 게시글 표시
    } else {
      setFilteredPosts(
        posts.filter(post =>
          activeTags.some(tag => post.hashTags && post.hashTags.includes(tag)),
        ),
      );
    }
  }, [activeTags, posts]);

  return (
    <SafeAreaView style={styles.container}>
      <Header navigation={navigation} />

      {/* 해시태그 버튼 */}
      <View style={styles.hashtagWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hashtagScrollContent}>
          {hashtags.map(tag => (
            <Pressable
              key={tag}
              style={[
                styles.hashtagButton,
                activeTags.includes(tag) && styles.activeHashtagButton,
              ]}
              onPress={() => toggleTag(tag)}>
              <Text
                style={[
                  styles.hashtagText,
                  activeTags.includes(tag) && styles.activeHashtagText,
                ]}>
                {tag}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* 게시글 리스트 */}
      <ScrollView contentContainerStyle={styles.postsContainer}>
        {filteredPosts.length === 0 ? (
          <Text style={styles.emptyMessage}>
            해당 해시태그에 해당하는 게시글이 없습니다.
          </Text>
        ) : (
          filteredPosts.map(item => (
            <View key={item.id} style={styles.postContainer}>
              <View style={styles.profileContainer}>
                <Pressable
                  onPress={() =>
                    navigation.navigate('OtherProfile', {
                      memberId: item.memberId,
                    })
                  }>
                  <Image
                    source={{uri: item.memberImage}}
                    style={styles.profileImage}
                  />
                </Pressable>
                <View style={styles.profileText}>
                  <Pressable
                    onPress={() =>
                      navigation.navigate('OtherProfile', {
                        memberId: item.memberId,
                      })
                    }>
                    <Text style={styles.name}>{item.memberName || '익명'}</Text>
                  </Pressable>
                  <Text style={styles.time}>
                    {item.createdAt ? formatDate(item.createdAt) : '방금 전'}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() =>
                  navigation.navigate('Feed', {feedId: item.feedId})
                }>
                <Image
                  source={{uri: item.feedImage}}
                  style={styles.contentImage}
                />
              </Pressable>
              <Text style={styles.postText}>{item.contents}</Text>
            </View>
          ))
        )}
      </ScrollView>

      <NavBar navigation={navigation} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  hashtagWrapper: {
    marginVertical: height * 0.01,
  },
  hashtagScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.01,
  },
  hashtagButton: {
    paddingVertical: height * 0.01,
    paddingHorizontal: width * 0.04,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: width * 0.05,
    backgroundColor: '#fff',
    marginRight: width * 0.02,
  },
  activeHashtagButton: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  hashtagText: {
    fontSize: width * 0.04,
    color: '#000',
  },
  activeHashtagText: {
    color: '#fff',
  },
  emptyMessage: {
    textAlign: 'center',
    marginTop: height * 0.02,
    color: '#888',
    fontSize: width * 0.04,
  },
  postContainer: {
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.015,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height * 0.01,
  },
  profileImage: {
    width: width * 0.1,
    height: width * 0.1,
    borderRadius: (width * 0.1) / 2,
    marginRight: width * 0.03,
  },
  profileText: {
    justifyContent: 'center',
  },
  name: {
    fontSize: width * 0.04,
    fontWeight: 'bold',
    color: '#000',
  },
  time: {
    fontSize: width * 0.035,
    color: '#888',
  },
  contentImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: width * 0.02,
    marginBottom: height * 0.015,
  },
  postText: {
    fontSize: width * 0.04,
    color: '#333',
    marginBottom: height * 0.01,
  },
});

export default MainSocial;
