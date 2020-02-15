require 'rubygems'
require 'bundler/setup'
Bundler.require(:default, :development, :jekyll_plugins)
require 'jekyll'

HERE = File.expand_path("./")
SITE = File.join(HERE, "_site")
TEST_CACHE = File.join(HERE, ".cache", "htmlproofer")

def jekyll(serve=true)
  options = {
    :source => HERE,
    :destination => SITE,
    :watch => serve,
    :serving => serve,
  }.merge( serve ? {:url => 'http://localhost:4000'} : {} )
  Jekyll::Commands::Build.process(options)
  if serve
    Jekyll::Commands::Serve.process(options)
  end
rescue
  nil
end

desc "Build the site out into #{File.basename(SITE)}"
task :build do
  jekyll(serve=false)
end

desc "Serve up the site (watching for changes)"
task :serve do
  jekyll()
end

desc "Check the site for linking issues"
task :test => [:build] do
  require 'html-proofer'

  options = {
  	:assume_extension => true,
  	:allow_hash_href => true,
  	:http_status_ignore => [999],  # because LinkedIn doesn't like being pinged
  	:check_html => true,
  	:check_img_http => true,
  	:check_opengraph => true,
    :parallel => {
      :in_processes => 3
    },
    :cache => {
      :storage_dir => TEST_CACHE,
      :timeframe => "30d",
    },
  }
  HTMLProofer.check_directory(SITE, options).run
end
