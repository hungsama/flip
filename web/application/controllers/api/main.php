<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class Main extends CI_Controller {
    protected $array_thumb_content = array();
    protected $array_thumb_topic = array();
    protected $array_topic = array('Thể thao', 'Đời sống', 'Pháp luật', 'Kinh Tế', 'Xã Hội', 'Du lịch', 'Thi cử', 'Vui lạ');
    public function __construct()
    {
        parent::__construct();
        $this->load->model('api/mongo_common_model', 'mongo_model');
        $this->array_thumb_content = array(
            'http://hdwallpaperfootballs.com/wp-content/uploads/2014/02/Manchester-United-Rooney-RVP-Mata-Wallpaper-2014-1.jpg',
            'http://walldiskpaper.com/wp-content/uploads/2015/01/Manchester-United-3D-Wallpaper.jpg',
            'http://www.footballhdpic.com/wp-content/uploads/2014/05/manchester-united-desktop-wallpaper-hd-3.jpg',
            'http://fc04.deviantart.net/fs71/f/2014/030/1/b/wayne_rooney_manchester_united_wallpaper_by_jeffery10-d74dhmq.jpg'
        );

        $this->array_thumb_topic = array(
            'http://hdwallpaperfootballs.com/wp-content/uploads/2014/02/Manchester-United-Rooney-RVP-Mata-Wallpaper-2014-1.jpg',
            'http://walldiskpaper.com/wp-content/uploads/2015/01/Manchester-United-3D-Wallpaper.jpg',
            'http://www.footballhdpic.com/wp-content/uploads/2014/05/manchester-united-desktop-wallpaper-hd-3.jpg',
            'http://fc04.deviantart.net/fs71/f/2014/030/1/b/wayne_rooney_manchester_united_wallpaper_by_jeffery10-d74dhmq.jpg'
        );
        $this->load->library('simple');
    }

    public function setting_autoincrement()
    {
        $list = array(
            'admins',
            'users',
            'topics',
            'news',
            'thirdparty_friends',
            'follow_friends',
            'follow_topics',
            'likes', 
            'votes',
            'comments',
            'admin_logs',
            'tokens',
            'logs'
        );

        foreach ($list as $key => $value) {
            $data = array('_id' => $value, 'seq' => 0);
            $this->mongo_model->create_collection($value);
            $this->mongo_model->add_data(
                $value, #->table
                $data #->info insert
            );
        }
        echo 'xong';
    }

    public function import_data_sample()
    {
        # data for collection admins
        $data_admins = array();
        for ($i=1; $i <=10 ; $i++) { 
            $hash = 'hash-'.$i;
            $data_admins[] = array(
                'email'       => 'sysadmin-'.$i.'@news.com',
                'password'    => md5('sys'.$hash),
                'hash'        => $hash,
                'grant'       => array_rand(array('root', 'admin', 'root')),
                'permissions' => '',
                'time_create' => time(),
                'time_update' => 0,
                'create_by'   => 'hungsama@gmail.com',
                'update_by'   => '' 
            );
        }

        # data for collection news
        $data_news = array();
        for ($i=1; $i < 20; $i++) { 
            $data_news[] = array(
                'title' => $i.' - Manchester United thắng Liverpool: "Quỷ đỏ" đích thực của nước Anh',
                'description' => $i.' - Việc hạ gục đối thủ truyền kiếp Liverpool ngay tại sân nhà của đội bóng áo đỏ vùng Merseyside không chỉ giúp MU tạo được cách biệt 5 điểm với “The Kop” mà còn đem lại sự tự tin cho thầy trò Van Gaal trên con đường hiện thực hóa mục tiêu top 4.',
                'content' => $i.' - Chiến thắng 2-1 vừa qua của MU trước Liverpool trên sân Anfield ghi đậm dấu ấn cách điều binh khiển tướng của HLV Louis Van Gaal bên phía đội khách. Đầu tiên phải kể đến việc chiến lược gia người Hà Lan bất ngờ sử dụng Juan Mata đá chính trong vai trò hộ công cho tiền đạo duy nhất Wayne Rooney.

Hiệu quả đã đến bất ngờ khi tiền vệ người Tây Ban Nha chơi rực sáng với việc lập một cú đúp để giúp MU đánh bại Liverpool lần thứ 2 trong mùa giải năm nay. Cả 2 pha lập công của Mata trong trận đấu này đều là những tình huống ghi bàn rất đẹp mắt thể hiện kĩ thuật và sự nhạy cảm đáng khen của anh.

Ở bàn mở tỉ số, Mata đã thoát xuống vòng cấm địa rất nhanh để đón đường chọc khe tinh tế xuyên giữa hai cầu thủ phòng ngự Sakho và Moreno bên phía Liverpool trước khi tiền vệ mang áo số 8 của MU dứt điểm chéo góc gọn gàng hạ gục thủ thành Mignolet. <br>Nhưng đáng kể nhất vẫn là bàn thắng thứ 2 của anh ở trận này. Từ pha chuyền bổng ở cự li ngắn đầy tinh tế của Di Maria, Mata tung người volley kiểu “ngả bàn đèn” đầy bất ngờ và ngẫu hứng làm tung lưới của Liverpool lần thứ 2.

Điểm cộng tiếp theo trong cách bố trí nhân sự của Van Gaal ở trận vừa qua chính là việc ông đã dám mạnh dạn gạt bỏ sơ đồ yêu thích 3-5-2 vốn tiềm ẩn nhiều bất trắc trước đó để sử dụng chiến thuật 4-1-4-1 rất linh động và hiệu quả.

Sau rất nhiều thử nghiệm, có vẻ như Van Gaal đã tìm được hệ thống tối ưu với sơ đồ cân bằng giữa công và thủ này, tạo ra một MU cực chắc chắn khi phòng ngự và khó lường khi tấn công. Tất nhiên, sơ đồ chỉ là một phần, những con người được sắp xếp vào đó mới là điều quan trọng nhất.

Van Gaal đã đúng khi giữ nguyên đội hình xuất phát từ trận thắng 3-0 trước Tottenham. Tại Anfield, một thế trận tương tự được tạo ra nhưng “Quỷ đỏ” không đủ sắc bén và mạo hiểm để giành được một chiến thắng đậm hơn. ',
                'thumb' => $this->array_thumb_content[array_rand($this->array_thumb_content)],
                'list_comments' => array(mt_rand(1,20), mt_rand(1,20),mt_rand(1,20),mt_rand(1,20)),
                'list_likes' => array(mt_rand(1,20), mt_rand(1,20),mt_rand(1,20),mt_rand(1,20)),
                'list_views' => array(mt_rand(1,20), mt_rand(1,20),mt_rand(1,20),mt_rand(1,20)),
                'list_rates' => array(mt_rand(1,20), mt_rand(1,20),mt_rand(1,20),mt_rand(1,20)),
                'list_shares' => array(mt_rand(1,20), mt_rand(1,20),mt_rand(1,20),mt_rand(1,20)),
                'total_likes' => mt_rand(0, 10),
                'total_comments' => mt_rand(0,10),
                'total_views' => mt_rand(0, 10),
                'total_rates' => mt_rand(0, 10),
                'total_shares' => mt_rand(0,20),
                'group_pin' => array('goc_12h', 'goc_3h', 'goc_4h'),
                'publish' => 1,
                'topic_id' => mt_rand(1,10),
                'ordering' => $i,
                'role' => array_rand(array('only_me', 'all', 'friends', 'custome')), # có thể tạo ra nhiều group về quyền
                'time_create' => time(),
                'time_update' => 0  
            );
        }

        # data for collection topics
        $data_topics = array();
        for ($i=1; $i <=10 ; $i++) { 
            $data_topics[] = array(
                'title' => $i.' - '. $this->array_topic[array_rand($this->array_topic)],
                'parent' => mt_rand(0,10),
                'description' => $i.' - Đội hình xuất sắc nhất lịch sử NHA: MU độc tôn',
                'thumb' => $this->array_thumb_topic[array_rand($this->array_thumb_topic)],
                'publish' => mt_rand(0,1),
                'list_follows' => array(mt_rand(1,20), mt_rand(1,20),mt_rand(1,20),mt_rand(1,20)),
                'total_follows' => mt_rand(0,10),
                'total_contents' => mt_rand(0, 10),
                'ordering' => $i,
                'copyright' => $i.'test'
            );
        }

        # data for collection users
        $data_users = array();
        for ($i=1; $i <= 20; $i++)
        {
            $hash = 'hash-'.$i;
            $data_users[] = array(
                'username' => $i.'test',
                'password' => md5('user'.$hash),
                'fullname' => strtoupper($i.' test'),
                'email' => $i.'test@news.com',
                'phone_number' => '097511423'.$i,
                'company' => 'xay ló thôn '.$i,
                'live' => 'Hà Nội ' .$i,
                'birthplace' => '0'.$i.'-08-1988',
                'friend' => array(),
                'access_token' => md5($i.'test'),
                'topic_follows' => mt_rand(1,5),
                'friend_follows' => array(mt_rand(1,20), mt_rand(1,20),mt_rand(1,20),mt_rand(1,20)),
                'time_create' => time(),
                'time_update' => 0,
                'hash' => $hash,
                'type' => 'admin'
            );
        }

        # data for collection flows users
        $data_friend_follows = array();
        for ($i=1; $i <19 ; $i++) { 
            $data_friend_follows[] = array(
                'follows' => array($i, $i+1),
                'time' => time()
            );
        }

        # data for collection follow topics
        $data_topic_follows = array();
        for ($i=1; $i <19 ; $i++) { 
            $data_topic_follows[] = array(
                'follows' => array($i, $i+1), # topic/user_id
                'time' => time()
            );
        }
        
        # data for collection friends from thirdparty
        $data_friends = array();
        for ($i=1; $i <=20 ; $i++) { 
            $data_friends[] = array(
                'user_id' => $i, 
                'friend_id' => $i+1,
                'fullname' => $i.'myfriend test',
                'type' => array_rand(array('facebook', 'google', 'live')),
                'thumb' => $this->array_thumb_topic[array_rand($this->array_thumb_topic)],
                'email' => $i.'friend@test.com',
                'time_create' => 'time',
                'time_update' => 0
            );
        }
        
        # data for collection likes
        $data_likes = array();
        for ($i=1; $i <= 10 ; $i++) { 
            $data_likes[] = array(
                'article_id' => $i,
                'user_id' => $i,
                'time' => time()
            );
        }
        # data for colection comments
        $data_comments = array();
        for ($i=1; $i <=10 ; $i++) { 
            $data_comments[] = array(
                'article_id' => $i,
                'user_id' => $i,
                'content' => $i.' - test comment',
                'time' => time(),
                'is_edit' => mt_rand(0,1), 
            );
        }
        
        # data for colection votes
        $data_votes = array();
        for ($i=1; $i <= 10; $i++)
        {
             $data_votes[] = array(
                'article_id' => $i,
                'user_id' => $i,
                'score' => $i,
                'time' => time(),
                'is_edit' => mt_rand(0,1), 
            );
        }

        $list = array(
            'admins' => $data_admins,
            'users'  => $data_users,
            'topics' => $data_topics,
            'news' => $data_news,
            'thirdparty_friends' => $data_friends,
            'follow_friends' => $data_friend_follows,
            'follow_topics' => $data_topic_follows,
            'likes' => $data_likes, 
            'votes' => $data_votes,
            'comments' =>$data_comments
        );
        foreach ($list as $key => $value) {
            foreach ($value as $k => $v) {
                $this->mongo_model->add_data(
                    $key, #->table
                    $v#->info insert
                );
            }
        }
        echo 'xong';
    }

    public function update()
    {
        $data = $this->mongo_model->get_data(
            'topics', #->table
            array(), #->select
            array(
                'where' => array(
                    '_id' => array('$ne' => 'topics'),
                    'parent' => array('$ne' => 0)
                )
            ), #->conditions
            false, #->is count records
            true #->multiple records
        );
        foreach($data as $d)
        {
            $alias = strtolower($this->simple->trans($d->title));
            $alias = preg_replace('!\s+!', ' ', $alias);
            $alias = str_replace(' ','-', $alias);
            $this->mongo_model->update_data(
                'topics', #->table
                array(
                    'where' => array(
                        '_id' => $d->_id
                    )
                ), #->conditions
                array('alias' => $alias) #->info update
            );
        }
        echo 'xong';
    }

    public function test()
    {
        $url = BASE_API.'topic.json';
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_HTTPHEADER, array(
            'Authorization: OAuth abzcx'
        ));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); 
        $res = curl_exec($ch);
        $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        var_dump($res);
    }
}

/* End of file main.php */
/* Location: ./application/controllers/api/main.php */