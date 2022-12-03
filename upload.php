<?php
# Declare Files

// echo json_encode($_POST);
echo json_encode($_GET);
$upload_count = filter_input(INPUT_GET, "upload_count", FILTER_VALIDATE_INT);
$sec_dir = $_GET["sec_dir"];

// echo json_encode($_FILES);
$input = $_FILES['audio_data']['tmp_name']; //get the temporary name that PHP gave to the uploaded file
// $output = $target_dir . basename($_FILES['audio_data']['name'].".wav");
// if (!file_exists($target_dir)) {
//     mkdir($target_dir, 7777, true);
// }
// if (!file_exists($target_dir)) {
//   die("Unable to make dir ".$target_dir);
// }
// move_uploaded_file($input, $output);

include 'cred.php';

$size = $_FILES['audio_data']['size']; //the size in bytes

// # FTP

$dir = '/uploads/'.$sec_dir."/";
$remote_file = $dir. basename($_FILES['audio_data']['name'].".wav");

// try to create directory $dir
// if is_dir($dir)
if ($upload_count==0) {
  $ftp_conn = ftp_connect($_server) or die("Could not connect to $_server");
  $login = ftp_login($ftp_conn, $ftp_user, $ftp_password);
  if (ftp_mkdir($ftp_conn, $dir))
    {
    echo "Successfully created $dir";
    }
  else
    {
    echo "Error while creating $dir";
    }
    // close connection
    ftp_close($ftp_conn);
  }

// # Upload File
$ch = curl_init();
$ftp_file = fopen($input, 'r');

curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_URL, $server.$remote_file);
// curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
curl_setopt($ch, CURLOPT_USERPWD, $ftp_user.":".$ftp_password);

curl_setopt($ch, CURLOPT_POST, 1);
$cf = new CurlFile($input);
curl_setopt($ch, CURLOPT_POSTFIELDS, ["upload" => $cf]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FAILONERROR, true);
curl_setopt($ch, CURLOPT_UPLOAD, 1);
curl_setopt($ch, CURLOPT_INFILE, $ftp_file);
curl_setopt($ch, CURLOPT_INFILESIZE, $size);
$result = curl_exec($ch);
// curl_close($ch);
$response = json_decode($result, true);
echo "Response:\n---------\n";
echo"<pre>";
echo $response;



if (curl_errno($ch)) {
    $error_msg = curl_error($ch);
    die("".$error_msg);
}
// echo ;
echo $response;


echo "<p>Uploaded</p>".$_SERVER['HTTP_HOST'];

?>
