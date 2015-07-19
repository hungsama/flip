<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

require_once('mongo_result.php');

/**
* MongoDB Driver
* @author ThinhNT
*/
class CI_DB_mongo_driver
{
    private $hostname           = 'localhost';
    private $username           = '';
    private $password           = '';
    private $database           = '';
    private $write_concern      = 1;
    public $autoinit            = true;
    private $db_debug           = true;
    private $connect            = true;
    private $replicaSet         = '';
    private $readPreference     = '';
    private $readPreferenceTags = '';
    private $ai_collection      = 'mongo_autoincrement';

    private $db                 = null;
    public $conn                = null;

    private $collection         = null;
    private $wheres             = array();
    private $selects            = array();
    private $limit              = null;
    private $offset             = null;
    private $order_by           = array();
    private $sets               = array();
    private $group_by;

    private $last_inserted = array();
    private $affected_rows = 0;

    function __construct($params)
    {

        foreach ($params as $key => $value) {
            $this->$key = $value;
        }
    }

    /**
     * init MongoClient object
     * @return none
     */
    public function initialize()
    {
        $server = "mongodb://{$this->hostname}";
        $options = array(
            'db'      => $this->database,
            'connect' => $this->connect,
            'w'       => $this->write_concern
        );
        if ($this->username != '') {
            $options['username'] = $this->username;
        }
        if ($this->password != '') {
            $options['password'] = $this->password;
        }
        if ($this->replicaSet) {
            $options['replicaSet'] = $this->replicaSet;

            if ($this->readPreference != '')
                $options['readPreference'] = $this->readPreference;

            if ($this->readPreferenceTags != '')
                $options['readPreferenceTags'] = $this->readPreferenceTags;
        }

        try {
            $this->conn = new MongoClient($server, $options);
            return $this->init_db($this->database);

        } catch (Exception $e) {
            log_message('error', $e->getMessage());

            if ($this->db_debug) {
                $this->show_error($e);
            }

            return false;
        }

    }

    /**
     * init MongoDB object
     * @param  string $database database's name
     * @return none
     */
    private function init_db($database)
    {
        if ($this->database == '') {
            log_message('error', 'Invalid database\'s name');

            if ($this->db_debug) {
                $this->show_error('Invalid database\'s name');
            }

            return false;
        }

        try {
            // $dbs = $this->conn->listDBs();
            // if (! $dbs['ok']) {
            //  log_message('error', $dbs['errmsg']);

            //  if ($this->db_debug) {
            //      $this->show_error($dbs['errmsg']);
            //  }

            //  exit();
            // }

            // $dbs = $dbs['databases'];
            // $exist = false;
            // foreach ($dbs as $db) {
            //  if ($this->database == $db['name']) {
            //      $exist = true;
            //      break;
            //  }
            // }

            // if (! $exist) {
            //  log_message('error', "Database '{$this->database}' does not exist.");

            //  if ($this->db_debug) {
            //      show_error("Database '{$this->database}' does not exist.");
            //  }

            //  exit();
            // }

            $this->db = $this->conn->selectDB($database);
            return true;

        } catch (Exception $e) {
            log_message('error', $e->getMessage());

            if ($this->db_debug) {
                $this->show_error($e);
            }

            return false;
        }
    }

    /**
     * init MongoCollection object
     * @param  string $collection collection's name
     * @return none
     */
    private function init_collection($collection)
    {
        if ($this->collection)
            return true;

        if ($collection == '') {
            log_message('error', 'Invalid collection.');
            if ($this->db_debug)
                $this->show_error('Invalid collection.');

            $this->free_data();
            return false;
        }

        if (! $this->conn)
            if (! $this->initialize()) {
                $this->free_data();
                return false;
            }

        try {
            $collections = $this->db->listCollections();
            $exist = false;
            foreach ($collections as $c) {
                if ($collection == $c->getName()) {
                    $exist = true;
                    break;
                }
            }

            if (! $exist) {
                log_message('error', "Collection '$collection' does not exist.");

                if ($this->db_debug) {
                    $this->show_error("Collection '$collection' does not exist.");
                }
                $this->free_data();
                return false;
            }

            $this->collection = $this->db->selectCollection($collection);
            return true;

        } catch (Exception $e) {
            log_message('error', $e->getMessage());

            if ($this->db_debug) {
                $this->show_error($e);
            }
            $this->free_data();
            return false;
        }
    }

    /**
     * Manual connect to server
     * @return none
     */
    public function connect()
    {
        if (! $this->conn)
            if (! $this->initialize())
                return false;

        try {
            return $this->conn->connect();

        } catch (MongoConnectionException $e) {
            log_message('error', $e);

            if ($this->db_debug) {
                $this->show_error($e);
            }

            return false;
        }
    }

    /**
     * close connection
     * @return none
     */
    public function close()
    {
        if (! $this->conn)
            return true;

        return $this->conn->close();
    }

    /**
     * Determine which fields want to get
     * Map to SELECT [fields,...] in MySQl
     *
     * @param  string $select list of fields want to get
     * @return $this
     */
    public function select($select = '*', $value = '')
    {
        if (is_array($select)) {
            foreach ($select as $key => $value) {
                $this->selects[$key] = $value;
            }

            return $this;
        }

        if (trim($select) == '*')
            return $this;

        if ($value !== '') {
            $this->selects[$select] = $value;
            return $this;
        }

        $select_array = explode(',', $select);
        foreach ($select_array as $field) {
            $this->selects[trim($field)] = true;
        }

        // if (! isset($this->selects['_id']))
        //  $this->selects['_id'] = false;

        return $this;
    }

    /**
     * Determine collection to get data
     * Map to FROM `table` in MySQL
     *
     * @param  string $collection collection's name
     * @return $this
     */
    public function from($collection)
    {
        if (! $this->init_collection($collection))
            return false;

        return $this;
    }

    /**
     * Map to WHERE condition in MySQL
     * @param  array or string $key   array of condition or field's name
     * @param  mixed $value value of field
     * @return $this
     */
    public function where($key, $value = null)
    {
        if (is_array($key)) {
            foreach ($key as $k => $v) {
                $this->wheres[$k] = $v;
            }
        } else {
            $this->wheres[$key] = $value;
        }

        return $this;
    }

    /**
     * WHERE ... < ...
     *
     * @param  [type] $key   [description]
     * @param  [type] $value [description]
     * @return [type]        [description]
     */
    public function where_lt($key, $value)
    {
        $this->wheres[$key]['$lt'] = $value;

        return $this;
    }

    /**
     * WHERE ... <= ...
     *
     * @param  [type] $key   [description]
     * @param  [type] $value [description]
     * @return [type]        [description]
     */
    public function where_lte($key, $value)
    {
        $this->wheres[$key]['$lte'] = $value;

        return $this;
    }

    /**
     * WHERE ... > ...
     *
     * @param  [type] $key   [description]
     * @param  [type] $value [description]
     * @return [type]        [description]
     */
    public function where_gt($key, $value)
    {
        $this->wheres[$key]['$gt'] = $value;

        return $this;
    }

    /**
     * WHERE ... >= ...
     * @param  string $key   field's name
     * @param  mixed $value value
     * @return $this
     */
    public function where_gte($key, $value)
    {

        $this->wheres[$key]['$gte'] = $value;

        return $this;
    }



    /**
     * WHERE ... NOT...
     * @param  string $key   filed's name
     * @param  mixed $value value
     * @return $this
     */
    public function where_not($key, $value)
    {
        $this->wheres[$key]['$ne'] = $value;

        // $this->wheres[$key]['$nin'][] = $value;

        return $this;
    }

    /**
     * WHERE ... IN ...
     * @param  string $key   field's name
     * @param  array $value  array of values
     * @return $this
     */
    public function where_in($key, $value)
    {
        $this->wheres[$key]['$in'] = $value;

        return $this;
    }

    /**
     * WHERE ... NOT IN ...
     * @param  string $key   field's name
     * @param  array $value array of values
     * @return $this
     */
    public function where_not_in($key, $value)
    {
        $this->wheres[$key]['$nin'] = $value;

        return $this;
    }

    /**
     * WHERE [EXP] OR [EXP] ...
     * @param  string $key   field's name
     * @param  mixed $value value
     * @return $this
     */
    public function where_or($exps)
    {
        if (!is_array($exps)) {
            log_message('error', 'Invalid parameter.');

            if ($this->db_debug)
                $this->show_error('Invalid parameter.');

            $this->free_data();

            return false;
        }

        $this->wheres['$or'] = $exps;

        return $this;
    }

    public function or_where($key, $value)
    {
        // if (empty($this->wheres)) {
        //  $this->wheres[$key] = $value;

        //  return $this;
        // }

        // $last = end($this->wheres);
        // $last_key = key($this->wheres);

        // if ($last_key == '$or') {
        //  $this->wheres['$or'][] = array($key => $value);
        // }
        // else {
        //  $this->wheres['$or'][] = array($key => $value);
        //  $this->wheres['$or'][] = array($last_key => $last);
        //  unset($this->wheres[$last_key]);
        // }
        //

        $this->wheres['$or'][] = array($key => $value);

        return $this;
    }

    /**
     * Equivalent LIKE in MySQL
     * @param  int or array $key   field's name or array of condition
     * @param  $value pattern
     * @return $this
     */
    public function like($key, $value = null)
    {
        if (is_array($key)) {
            foreach ($key as $k => $v) {
                $this->wheres[$k] = new MongoRegex('/'.preg_quote($v).'/');
            }

        } else {
            $this->wheres[$key] = new MongoRegex('/'.preg_quote($value).'/');
        }

        return $this;
    }

    /**
     * WHERE ... NOT LIKE ...
     * @param  [type] $key   [description]
     * @param  [type] $value [description]
     * @return [type]        [description]
     */
    public function not_like($key, $value = null)
    {
        if (is_array($key)) {
            foreach ($key as $k => $v) {
                $this->wheres[$k]['$nin'][] = new MongoRegex('/'.preg_quote($v).'/');
            }

        } else {
            $this->wheres[$key]['$nin'][] = new MongoRegex('/'.preg_quote($value).'/');
        }

        return $this;
    }

    /**
     * [or_like description]
     * @param  [type] $key   [description]
     * @param  [type] $value [description]
     * @return [type]        [description]
     */
    public function or_like($key, $value)
    {
        // if (empty($this->wheres)) {
        //  $this->wheres[$key] = $value;

        //  return $this;
        // }

        // $last = end($this->wheres);
        // $last_key = key($this->wheres);

        // if ($last_key == '$or') {
        //  $this->wheres['$or'][] = array($key => new MongoRegex("/$value/"));
        // }
        // else {
        //  $this->wheres['$or'][] = array($key => new MongoRegex("/$value/"));
        //  $this->wheres['$or'][] = array($last_key => $last);
        //  unset($this->wheres[$last_key]);
        // }

        return $this;
    }

    /**
     * Determine how many results want to get
     * @param  int $limit  limit
     * @param  int $offset offset
     * @return $this
     */
    public function limit($limit, $offset = null)
    {
        $this->limit = $limit;

        if ($offset !== null)
            $this->offset = $offset;

        return $this;
    }

    /**
     * Sort list of result by fields
     * @param  array  $order array of fields and sort type
     * @return $this
     */
    public function order_by($order, $type = 'ASC')
    {
        if (is_array($order))
            $this->order_by = $order;
        else
            $this->order_by[$order] = (strtoupper($type) == 'DESC') ? -1 : 1;

        return $this;
    }

    /**
     * Make a select query with group by operation
     * This method is not equivalent with active record of codeigniter
     * view more detail at php.net
     *
     * @param  string $collection collection's name
     * @param  array  $fields     list of fields want to group
     * @param  array  $initial    init result
     * @param  MongoCode $reduce  function to do something with current cursor
     * @param  array  $options
     * @return array of result
     */
    public function group($collection = null, $fields = null, $initial = null, $reduce = null, $options = array())
    {
            if (! $this->init_collection($collection))
                return false;

        try {
            $res = $this->collection->group($fields, $initial, $reduce);

            $this->free_data();

            if (! $res['ok']) {
                log_message('error', $res['errmsg']);

                if ($this->db_debug) {
                    $this->show_error($res['errmsg']);
                }

                return false;
            }

            return $res;

        } catch (Exception $e) {
            log_message('error', $e->getMessage());

            if ($this->db_debug) {
                $this->show_error($e);
            }
            $this->free_data();
            return false;
        }
    }

    /**
     * get distinct values of a field
     * @param  string $field      field name
     * @param  string $collection collection name
     * @return array
     */
    public function distinct($field = '', $collection = null)
    {
        if (! $this->init_collection($collection))
            return false;

        try {
            $res = $this->collection->distinct($field, $this->wheres);

            $this->free_data();

            return $res;

        } catch (Exception $e) {
            log_message('error', $e->getMessage());

            if ($this->db_debug) {
                $this->show_error($e);
            }

            $this->free_data();

            return false;
        }
    }

    /**
     * Make a select operation
     * @param  string $collection collection's name
     * @param  int $limit      limit of result
     * @param  int $offset
     * @return Mongo_result object  view class Mongo_result
     */
    public function get($collection = null, $limit = null, $offset = null)
    {
        if (! $this->init_collection($collection))
            return false;

        if ($limit !== null)
            $this->limit = $limit;
        if ($offset !== null)
            $this->offset = $offset;

        try {
            $res = $this->collection->find($this->wheres, $this->selects);

            if ($this->limit !== null)
                $res = $res->limit($this->limit);
            if ($this->offset !== null)
                $res = $res->skip($this->offset);
            if (! empty($this->order_by))
                $res = $res->sort($this->order_by);

            $this->free_data();

            return new Mongo_result($res);

        } catch (Exception $e) {
            log_message('error', $e->getMessage());

            if ($this->db_debug) {
                $this->show_error($e);
            }

            $this->free_data();

            return false;
        }
    }

    /**
     * Count all result of a select operation
     * @param  string $collection collection's name
     * @return int num of result
     */
    public function count_all_results($collection = null)
    {
        if (! $this->init_collection($collection))
            return false;

        $count = $this->collection->count($this->wheres, $this->limit, $this->offset);
        $this->free_data();

        return $count;
    }

    /**
     * Insert new document into collection
     * @param  string $collection collection's name
     * @param  array  $data       data want to insert
     * @param  array  $options    options: view php.net
     * @return mixed              status of operation
     */
    public function insert($collection = null, $data = null, $options = array())
    {
        if (count($data) == 0 or (! is_array($data) and ! is_object($data))) {
            log_message('error', 'Invalid data.');
            if ($this->db_debug)
                $this->show_error('Invalid data.');

            $this->free_data();

            return false;
        }

        if (! isset($options['w']))
            $options['w'] = $this->write_concern;

        if (isset($options['ai'])) {
            $ai_field = $options['ai'];
            unset($options['ai']);
        }

        if (isset($ai_field)) {
            if (is_array($data) and ! isset($data[$ai_field]))
                $data[$ai_field] = $this->last_id($collection);
            else if (is_object($data) and ! isset($data->$ai_field))
                $data->$ai_field = $this->last_id($collection);
        }

        if (! $this->init_collection($collection))
            return false;

        try {
            $res = $this->collection->insert($data, $options);

            $this->affected_rows = ($res['ok']) ? 1 : 0;

            $this->free_data();
            $this->last_inserted = (array) $data;

            return $res;

        } catch (Exception $e) {
            log_message('error', $e->getMessage());

            if ($this->db_debug) {
                $this->show_error($e);
            }

            $this->free_data();

            return false;
        }
    }

    /**
     * Insert multi documents to collection
     * @param  string $collection colleciton's name
     * @param  array  $batch      array of objects or arrays
     * @param  array  $options    options
     * @return mixed              status of operation
     */
    public function insert_batch($collection = null, $batch = null, $options = array())
    {
        if (count($batch) == 0 or ! is_array($batch)) {
            log_message('error', 'Invalid data.');
            if ($this->db_debug)
                $this->show_error('Invalid data.');

            $this->free_data();

            return false;
        }

        if (! $this->init_collection($collection))
            return false;

        if (! isset($options['w'])) {
            $options['w'] = $this->write_concern;
        }

        try {
            $res = $this->collection->batchInsert($batch, $options);

            $this->free_data();

            return $res;

        } catch (Exception $e) {
            log_message('error', $e->getMessage());

            if ($this->db_debug) {
                $this->show_error($e);
            }

            $this->free_data();

            return false;
        }


    }

    /**
     * Return a field's value of last inserted document
     * @param  string $field field's name
     * @return mixed  field's value
     */
    public function insert_id($field = '_id')
    {
        if ($field == '' or ! is_string($field))
            return false;

        if (isset($this->last_inserted[$field]))
            return $this->last_inserted[$field];

        return false;
    }

    /**
     * Set a new value for a field in update operation
     * @param string $field field's name
     * @param string $value new value
     */
    public function set($key, $value = '')
    {
        if (preg_match('/^\$.+/', $key))
            $this->sets[$key] = $value;
        else
            $this->sets['$set'][$key] = $value;

        return $this;
    }

    /**
     * Update one of multi collection
     * @param  string $collection collection's name
     * @param  array  $data       new data
     * @param  array  $where      condition
     * @param  array  $options    view php.net
     * @return if operation successful
     */
    public function update($collection = null, $data = null, $options = array())
    {
        if ($data !== null and ! is_array($data) and ! is_object($data)) {
            log_message('error', 'Invalid update data.');
            if ($this->db_debug)
                $this->show_error('Invalid update data.');

            $this->free_data();

            return false;
        }

        if ($data !== null) {
            foreach ($data as $key => $value) {
                $this->set($key, $value);
            }
        }

        if (is_object($data))
            $data = (array) $data;

        if (! $this->init_collection($collection))
            return false;

        if (! isset($options['w']))
            $options['w'] = $this->write_concern;
        if (! isset($options['multiple']))
            $options['multiple'] = true;
        if (! isset($options['upsert']))
            $options['upsert'] = false;

        try {
            $res = $this->collection->update($this->wheres, $this->sets, $options);

            $this->affected_rows = ($res['ok']) ? $res['n'] : 0;

            $this->free_data();
            return $res;

        } catch (Exception $e) {
            log_message('error', $e->getMessage());

            if ($this->db_debug) {
                $this->show_error($e);
            }

            $this->free_data();

            return false;
        }
    }

    /**
     * Delete document
     * @param  string $collection collection's name
     * @param  array  $where      only document be valid condition will be deleted
     * @param  array  $options    options: view php.net
     * @return if operation successful
     */
    public function delete($collection = null, $where = null, $options = array())
    {
        if ($where !== null and ! is_array($where)) {
            log_message('error', 'Invalid WHERE condition.');
            if ($this->db_debug)
                $this->show_error('Invalid WHERE condition.');

            $this->free_data();

            return false;
        }

        if ($where != null) {
            foreach ($where as $k => $v) {
                $this->wheres[$k] = $v; // $this->wheres += $where;
            }
        }

        if (! $this->init_collection($collection))
            return false;

        if (! isset($options['w']))
            $options['w'] = $this->write_concern;

        try {
            $res = $this->collection->remove($this->wheres, $options);

            $this->affected_rows = ($res['ok']) ? $res['n'] : 0;

            $this->free_data();

            return $res;

        } catch (Exception $e) {
            log_message('error', $e->getMessage());

            if ($this->db_debug) {
                $this->show_error($e);
            }

            $this->free_data();

            return false;
        }

    }

    /**
     * Do not implement yet
     */
    public function affected_rows()
    {
        // TODO: implement
        return $this->affected_rows;
    }

    /**
     * [aggregate description]
     * @param  string $collection [description]
     * @param  array  $pipeline   [description]
     * @return [type]             [description]
     */
    public function aggregate($collection = '', $pipeline = array())
    {
        if (! $this->init_collection($collection))
            return false;

        $res = $this->collection->aggregate($pipeline);

        $this->free_data();

        if (! $res['ok']) {
            $errMsg = $res['errmsg'] . '<br>';
            $errMsg .= 'Error Code: ' . $res['code'].'<br>';
            $trace = debug_backtrace();
            $errMsg .= "{$trace[0]['class']}->{$trace[0]['function']}() &nbsp;&nbsp;{$trace[0]['file']}:{$trace[0]['line']}";

            log_message('error', $errMsg);

            if ($this->db_debug)
                $this->show_error($errMsg);

            return false;
        }

        return $res['result'];
    }

    /**
     * [find_and_modify description]
     * @param  [type] $collection [description]
     * @param  [type] $update     [description]
     * @param  [type] $options    [description]
     * @return [type]             [description]
     */
    public function find_and_modify($collection, $update = null, $options = array())
    {
        if (! $this->init_collection($collection))
            return false;

        if (! isset($options['new']) and (! isset($options['remove']) or $options['remove'] == false))
            $options['new'] = true;

        try {

            $res = $this->collection->findAndModify($this->wheres, $update, $this->selects, $options);

            $this->free_data();

            return $res;

        } catch (Exception $e) {
            log_message('error', $e->getMessage());

            if ($this->db_debug)
                $this->show_error($e);

            $this->free_data();

            return false;
        }
    }

    /**
     * http://www.php.net/manual/en/mongocollection.save.php
     * @param  [type] $collection [description]
     * @param  [type] $data       [description]
     * @param  array  $option     [description]
     * @return [type]             [description]
     */
    public function save($collection, $data, $option = array())
    {
        if (! $this->init_collection($collection))
            return false;

        try {
            $res = $this->collection->save($data, $option);
            $this->free_data();

            return $res;

        } catch (Exception $e) {
            log_message('error', $e->getMessage());

            if ($this->db_debug)
                $this->show_error($e);

            $this->free_data();

            return false;
        }
    }

    /**
     * Free data for new operation
     * @return  none
     */
    private function free_data()
    {
        $this->wheres     = array();
        $this->selects    =array();
        $this->limit      = null;
        $this->offset     = null;
        $this->collection = null;
        $this->sets       = array();
        $this->order_by   = array();
    }

    private function show_error($message = '')
    {
        $LANG =& load_class('Lang', 'core');
        $LANG->load('db');

        $heading = $LANG->line('db_error_heading');

        if (is_object($message)) {
            $msg[] = $message->getMessage();
            $msg[1] = '';

            foreach (array_reverse($message->getTrace()) as $k => $v) {
                if (isset($v['file']) and isset($v['line']))
                    $line = '#'.($k + 1).': '.@$v['file'].':'.@$v['line'].' &nbsp;&nbsp;&nbsp;';
                if (isset($v['class']) and isset($v['function']))
                    $line .= $v['class'].'->'.$v['function'].'()<br>';
                else if (isset($v['function']))
                    $line .= $v['function'].'()<br>';
                else
                    $line .= '<br>';
                $msg[1] .= $line;
            }

            $message = $msg;
        }

        $error =& load_class('Exceptions', 'core');
        echo $error->show_error($heading, $message, 'error_db');

        exit;
    }

    /**
     * Get last id for autoincrement
     * @param  [type] $collection               [description]
     * @param  [type] $autoincrement_collection [description]
     * @return [type]                           [description]
     */
    private function last_id($collection)
    {
        $update = array(
            '$inc' => array('last_id' => 1)
        );
        $this->where('_id', $collection);
        $res = $this->find_and_modify($this->ai_collection, $update);

        return $res['last_id'];
    }
    
/*
     * Get collection list
     */
    public function get_list_collection() {
        $collections = $this->db->getCollectionNames();
        return $collections;
    }

    /*
     * creat new collection
     * @param : collection name
     */
    public function create_collection($collection) {
        if(!$collection) return false;

        $collections = $this->get_list_collection();
        if(in_array($collection, $collections)) return false;

        if($this->db->createCollection($collection)) return true;
        else return false;
    }

    /**
     *  Hàm lấy giá trị max của bảng tự động tăng theo key
     * @param  [type] $collection [description]
     * @param  string $key_unique [description]
     * @param  string $seq        [description]
     * @return [type]             [description]
     * Create by : hungsama@gmail.com - 17/03/2015
     */
    public function get_auto_increment($collection, $seq = 'seq')
    {
        if (! $this->init_collection($collection))
            return false;
            try {
            $res = $this->collection->findAndModify(
                array('_id' => $collection),
                array('$inc' => array($seq => 1)),
                null,
                array(
                    "new" => true,
                )
            );

            $this->free_data();

            return $res[$seq];

        } catch (Exception $e) {
            log_message('error', $e->getMessage());

            if ($this->db_debug)
                $this->show_error($e);

            $this->free_data();

            return false;
        }
    }
}