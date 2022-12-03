<?php


echo json_encode($_POST); //this will print out the received name, temp name, type, size, etc.
echo json_encode($_GET); //this will print out the received name, temp name, type, size, etc.

$name = $_POST["g34-name"];
$mail = $_POST["g34-email"];
$gender = $_POST["gender"];
$disease = json_encode($_POST["g34-patientsdieseasesinfo"]);

$sec_dir = $_GET["sec_dir"];
$audio_dir = '/uploads/'.$sec_dir;
$upload_count = filter_input(INPUT_GET, "upload_count", FILTER_VALIDATE_INT);
$attach = '/attachments/'.$sec_dir;

include "cred.php";

$conn = mysqli_connect($sql_host,
                       $sql_user,
                       $sql_password,
                       $sql_db);

if (mysqli_connect_errno()) {
    die("Connection error: " . mysqli_connect_error());
}

$sql = "INSERT INTO surveyform (name, mail, gender, disease, recording_dir, number_of_rec, extra_file_dir)
        VALUES (?, ?, ?, ?, ?, ?, ?)";

$stmt = mysqli_stmt_init($conn);

if ( ! mysqli_stmt_prepare($stmt, $sql)) {

    die(mysqli_error($conn));
}

mysqli_stmt_bind_param($stmt, "sssssis",
                       $name,
                       $mail,
                       $gender,
                       $disease,
                       $audio_dir,
                       $upload_count,
                       $attach);

mysqli_stmt_execute($stmt);

echo "Record saved.";
