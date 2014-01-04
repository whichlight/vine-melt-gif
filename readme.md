 # vine melt

this does three things:
+ server downloads a random vine video from twitter
+ client turns it into a gif
+ client pixel sorts that gif vertically based on brightness

Everytime you refresh, a new vine is pulled, downloaded, and submitted to the
browser for processing.

Originally I wanted to make an app that could take a vine URL and process this
on the client but CORS restricts manipulating the image data in the vine.  When the canvas src
is from a foreign URL it is 'tainted' and has restricted methods.

Second I wanted to automate the process of building these gifs to make another
tumblrbot, but phantom does not support video codecs, which makes sense.

One option is to set up a server so that people could submit vines and have them gif
melted.  In this case the server would download and serve the video of the input
url as it does here with a random tweet.
