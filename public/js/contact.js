( function( $ ) {

  var sendEmailFnUrl = "https://api.parse.com/1/functions/sendEmail";

  var emailForm = $( ".js-email-form" )
  var emailSubject = $( ".js-email-subject" );
  var emailFromName = $( ".js-email-from-name" );
  var emailFromAddress = $( ".js-email-from-address" );
  var emailText = $( ".js-email-text" );
  var emailSend = $( ".js-email-send" );

  var loadingMessage = $( ".js-loading-message" );
  var errorMessage = $( ".js-error-message" );
  var successMessage = $( ".js-success-message" );
  var messages = $( ".js-loading-message, .js-error-message, .js-success-message" );

  var duration = 400;

  var dfd = $.Deferred();

  // form setup
  var formElements = emailForm.find( "input, textarea" )

  function createEmailInstance() {
    emailForm.fadeOut( duration, function(){
      dfd.resolve();
    });

    var text = emailText.val().trim();
    var subject = emailSubject.val().trim();
    var fromName = emailFromName.val().trim();
    var fromAddress = emailFromAddress.val().trim();

    if ( text && subject && fromName && fromAddress ) {

      sendEmail({
        text: text,
        subject: subject,
        fromName: fromName,
        fromAddress: fromAddress          
      });

    } else {
      sendError();
    }

  }

  function sendEmail( email ) {
    return $.ajax({
      url: sendEmailFnUrl,
      data: email,
      type: "POST",
      beforeSend: function( req ) {
        req.setRequestHeader("X-Parse-Application-Id", "imcjoYKVqSTyp0LzQgEok5UjWYr84nOpp8O1gZny");
        req.setRequestHeader("X-Parse-REST-API-Key", "ZCs9Cz0vCzXtYH5Eq6TmlehB2WzpVCSYlxExdesc");        
      },
      success: sendSuccess,
      error: sendError
    });

  };

  function sendComplete() {
    var dfd = $.Deferred();
    emailForm.fadeOut( duration, function() {
      dfd.resolve();
    });
    return dfd.promise();
  }

  function sendSuccess( response ) {
    dfd.promise().then( function() {
      successMessage.fadeIn( duration );
    });
  }

  function sendError( response ) {
    dfd.promise().then( function() {
      errorMessage.fadeIn( duration );
    });
  }

  emailSend.one( "click", createEmailInstance );

  })( jQuery );