<?php 
if ( ! function_exists('call_api'))
{
    function call_api($url='', $method='GET', $data='{}', $debug=false)
    {
        if (!$url) return false;
        $ch = curl_init($url);
        // curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        //     'Authorization: OAuth '.$this->ci->session->userdata('uactk')
        // ));
        if (in_array($method, array('POST', 'PUT', 'DELETE')))
        {
            switch ($method) {
                case 'PUT':
                    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "PUT"); 
                    break;
                case 'DELETE':
                    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "DELETE"); 
                    break;
            }
            curl_setopt($ch, CURLOPT_POST, TRUE);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        }
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); 
        $res = curl_exec($ch);
        $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        return json_decode($res);
    }
}
?>