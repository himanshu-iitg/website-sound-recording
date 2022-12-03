<?php
// connect and login to FTP server
include "cred.php";
$input = $_FILES;

// $server = $_server;
$ftp_conn = ftp_connect($_server) or die("Could not connect to $_server");
$login = ftp_login($ftp_conn, $ftp_user, $ftp_password);

// get file list of current directory
$file_list = ftp_nlist($ftp_conn, "uploads/");
// close connection
ftp_close($ftp_conn);

echo json_encode($file_list);
exit;

?>
